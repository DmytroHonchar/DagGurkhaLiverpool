document.addEventListener("DOMContentLoaded", function() {
    const tableSection = document.querySelector('.table-input-section');
    const orderMenuSection = document.querySelector('main.order-container > section.menu-section');
    const confirmationSection = document.querySelector('.confirmation-section');
    const tableInput = document.getElementById('table-number');
    const tableSubmitBtn = document.getElementById('table-submit');
    const orderDetailsList = document.getElementById('order-details');
    const orderTotalEl = document.getElementById('order-total');
    const placeOrderBtn = document.getElementById('place-order');
    
    let order = {}; // Stores items ordered
    let tableNumber = "";
    
    tableSubmitBtn.addEventListener('click', function() {
      tableNumber = tableInput.value.trim();
      if (tableNumber === "") {
        alert("Please enter a table number");
        return;
      }
      tableSection.style.display = "none";
      orderMenuSection.style.display = "block";
    });
    
    const menuItems = orderMenuSection.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      const decreaseBtn = item.querySelector('.decrease');
      const increaseBtn = item.querySelector('.increase');
      const qtyInput = item.querySelector('.item-qty');
      const itemName = item.getAttribute('data-name');
      const itemPrice = parseFloat(item.getAttribute('data-price'));
      
      decreaseBtn.addEventListener('click', function() {
        let qty = parseInt(qtyInput.value);
        if (qty > 0) {
          qty--;
          qtyInput.value = qty;
          updateOrder(itemName, itemPrice, qty);
        }
      });
      
      increaseBtn.addEventListener('click', function() {
        let qty = parseInt(qtyInput.value);
        qty++;
        qtyInput.value = qty;
        updateOrder(itemName, itemPrice, qty);
      });
    });
    
    function updateOrder(name, price, qty) {
      if (qty === 0) {
        delete order[name];
      } else {
        order[name] = { price, qty };
      }
      renderOrderSummary();
    }
    
    function renderOrderSummary() {
      orderDetailsList.innerHTML = "";
      let total = 0;
      for (let name in order) {
        const { price, qty } = order[name];
        const li = document.createElement('li');
        li.textContent = `${name} x ${qty} = £${(price * qty).toFixed(2)}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = "Remove";
        removeBtn.classList.add("remove-btn");
        removeBtn.addEventListener("click", function() {
          updateOrder(name, price, 0);
          document.querySelector(`.menu-item[data-name="${name}"] .item-qty`).value = 0;
        });
        li.appendChild(removeBtn);
        orderDetailsList.appendChild(li);
        total += price * qty;
      }
      orderTotalEl.textContent = total.toFixed(2);
    }
    
    const tabButtons = document.querySelectorAll('.menu-tabs .tab-btn');
    const menuSections = document.querySelectorAll('.menu-container > .menu-section');
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        menuSections.forEach(sec => sec.style.display = 'none');
        const targetId = button.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.style.display = 'block';
        }
      });
    });
    
    if (menuSections.length > 0) {
      menuSections.forEach((sec, idx) => {
        sec.style.display = idx === 0 ? 'block' : 'none';
      });
    }
    
    placeOrderBtn.addEventListener('click', function() {
      if (Object.keys(order).length === 0) {
        alert("Please select at least one item");
        return;
      }
      const items = Object.keys(order).map(name => ({
        name,
        price: order[name].price,
        qty: order[name].qty
      }));
      
      // New fields for additional comments and customer email:
      const orderComment = document.getElementById('order-comments').value;
      const customerEmail = document.getElementById('customer-email').value;
      
      fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, items, orderComment, customerEmail })
      })
      .then(response => response.json())
      .then(data => {
        if (data.orderNumber) {
          orderMenuSection.style.display = "none";
          confirmationSection.style.display = "block";
          document.getElementById('order-number').textContent = data.orderNumber;
        } else {
          alert("Order failed: " + data.message);
        }
      })
      .catch(err => {
        console.error("Error placing order:", err);
        alert("Error placing order");
      });
    });
  });
  