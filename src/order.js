document.addEventListener("DOMContentLoaded", function() {
  // Define a common showMessage function for styled notifications.
  function showMessage(text, isSuccess) {
    const statusMessage = document.createElement('div');
    statusMessage.textContent = text;
    statusMessage.className = 'status-message ' + (isSuccess ? 'success' : 'error') + ' visible';
    document.body.appendChild(statusMessage);
    setTimeout(() => {
      statusMessage.classList.remove('visible');
      statusMessage.remove();
    }, 5000);
  }

  const tableSection = document.querySelector('.table-input-section');
  const orderMenuSection = document.querySelector('main.order-container > section.menu-section');
  const confirmationSection = document.querySelector('.confirmation-section');
  const tableInput = document.getElementById('table-number');
  const tableSubmitBtn = document.getElementById('table-submit');
  const orderDetailsList = document.getElementById('order-details');
  const orderTotalEl = document.getElementById('order-total');
  const placeOrderBtn = document.getElementById('place-order');
  
  // Get existing "Place Another Order" and "Exit" buttons from your HTML
  const newOrderBtn = document.getElementById('new-order-btn');
  const exitBtn = document.getElementById('exit-btn');

  let order = {};
  let tableNumber = "";

  // 1) Table Number
  tableSubmitBtn.addEventListener('click', function() {
    tableNumber = tableInput.value.trim();
    if (!tableNumber) {
      showMessage("Please enter a table number", false);
      return;
    }
    tableSection.style.display = "none";
    orderMenuSection.style.display = "block";
  });

  // 2) Menu Items: Increase/Decrease
  const menuItems = orderMenuSection.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    const decreaseBtn = item.querySelector('.decrease');
    const increaseBtn = item.querySelector('.increase');
    const qtyInput = item.querySelector('.item-qty');
    const itemName = item.getAttribute('data-name');
    const itemPrice = parseFloat(item.getAttribute('data-price'));

    decreaseBtn.addEventListener('click', function() {
      let qty = parseInt(qtyInput.value) || 0;
      if (qty > 0) {
        qty--;
        qtyInput.value = qty;
        updateOrder(itemName, itemPrice, qty);
      }
    });

    increaseBtn.addEventListener('click', function() {
      let qty = parseInt(qtyInput.value) || 0;
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

  // 3) Render Order Summary
  function renderOrderSummary() {
    orderDetailsList.innerHTML = "";
    let total = 0;
    for (let name in order) {
      const { price, qty } = order[name];
      const li = document.createElement('li');
      li.textContent = `${name} x ${qty} = £${(price * qty).toFixed(2)}`;

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = "Remove";
      removeBtn.classList.add("remove-btn");
      removeBtn.addEventListener("click", function() {
        updateOrder(name, price, 0);
        const itemEl = document.querySelector(`.menu-item[data-name="${name}"]`);
        if (itemEl) {
          itemEl.querySelector('.item-qty').value = 0;
        }
      });
      li.appendChild(removeBtn);

      orderDetailsList.appendChild(li);
      total += price * qty;
    }
    orderTotalEl.textContent = total.toFixed(2);
  }

  // 4) Tab Switching
  const tabButtons = document.querySelectorAll('.menu-tabs .tab-btn');
  const menuSections = document.querySelectorAll('.menu-container > .menu-section');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      menuSections.forEach(sec => sec.style.display = 'none');
      const targetId = button.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = 'block';
    });
  });
  // Show first tab on load
  menuSections.forEach((sec, idx) => {
    sec.style.display = idx === 0 ? 'block' : 'none';
  });

  // 5) Place Order
  placeOrderBtn.addEventListener('click', function() {
    if (Object.keys(order).length === 0) {
      showMessage("Please select at least one item", false);
      return;
    }

    const items = Object.keys(order).map(name => ({
      name,
      price: order[name].price,
      qty: order[name].qty
    }));

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
        showMessage("Order failed: " + data.message, false);
      }
    })
    .catch(err => {
      console.error("Error placing order:", err);
      showMessage("Error placing order", false);
    });
  });

  // 6) "Place Another Order" & "Exit" (already in HTML)
  newOrderBtn.addEventListener('click', () => {
    // Reload page (simple)
    window.location.reload();
  });

  exitBtn.addEventListener('click', () => {
    // Redirect to homepage
    window.location.href = '/';
  });
});
