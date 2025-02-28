document.addEventListener("DOMContentLoaded", function () {

  // Page loader
  const loader = document.getElementById("loadingOverlay");
  if (loader) {
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }
  // Create a floating status message element to show submission results
  const statusMessage = document.createElement('div');
  statusMessage.className = 'status-message';
  document.body.appendChild(statusMessage);

  function showMessage(text, isSuccess) {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${isSuccess ? 'success' : 'error'} visible`;
    setTimeout(() => {
      statusMessage.classList.remove('visible');
    }, 5000);
  }

  // Set minimum date for booking (date input) and check for Sundays & Mondays
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    const minDate = `${year}-${month}-${day}`;
    dateInput.setAttribute('min', minDate);

    dateInput.addEventListener('change', function () {
      const selectedDate = new Date(dateInput.value);
      if (!isNaN(selectedDate)) {
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        if (dayOfWeek === 0 || dayOfWeek === 1) {
          showMessage("Bookings cannot be made on Sundays or Mondays.", false);
          dateInput.value = "";
        }
      }
    });
  }

  // ================== Parallax Hero Effect ==================
  window.addEventListener("scroll", function () {
    const scrollPosition = window.scrollY;
    const heroBackground = document.querySelector(".hero-background");
    if (heroBackground) {
      const maxParallax = 120; // increased maximum
      const verticalParallax = Math.min(scrollPosition * 0.15, maxParallax);
      const scaleAmount = 1.1 - scrollPosition * 0.0001;
      const brightness = 1 + Math.min(scrollPosition * 0.0005, 0.1);
      const contrast = 1 + Math.min(scrollPosition * 0.0003, 0.05);

      requestAnimationFrame(() => {
        heroBackground.style.transform = `scale(${scaleAmount}) translateY(${verticalParallax}px)`;
        heroBackground.style.filter = `brightness(${brightness}) contrast(${contrast})`;
      });
    }
  });

  // ================== Food Carousel (Our Food Section) ==================
  const foodTrack = document.querySelector('.carousel-track');
  if (foodTrack) {
    const slides = Array.from(foodTrack.children);
    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');

    let currentIndex = 0;
    let slidesToShow = window.innerWidth < 768 ? 1 : 3;
    let slideWidth = slides[0].getBoundingClientRect().width;
    let gap = parseFloat(getComputedStyle(foodTrack).columnGap) || 0;
    let step = slideWidth + gap;
    let maxIndex = Math.max(0, slides.length - slidesToShow); // Ensure non-negative

    function updateFoodCarousel() {
      foodTrack.style.transform = `translateX(-${currentIndex * step}px)`;
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex >= maxIndex;
    }

    nextButton.addEventListener('click', () => {
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateFoodCarousel();
      }
    });

    prevButton.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateFoodCarousel();
      }
    });

    window.addEventListener('resize', () => {
      slidesToShow = window.innerWidth < 768 ? 1 : 3;
      slideWidth = slides[0].getBoundingClientRect().width;
      gap = parseFloat(getComputedStyle(foodTrack).columnGap) || 0;
      step = slideWidth + gap;
      maxIndex = Math.max(0, slides.length - slidesToShow);
      currentIndex = Math.min(currentIndex, maxIndex);
      updateFoodCarousel();
    });

    updateFoodCarousel();
  }

  // ================== Reviews Carousel ==================
  const reviewsTrack = document.querySelector('.reviews-track');
  if (reviewsTrack) {
    const reviewsPrevBtn = document.getElementById('reviewsPrevBtn');
    const reviewsNextBtn = document.getElementById('reviewsNextBtn');
    const reviewItems = document.querySelectorAll('.review-item');

    let reviewIndex = 0;
    let visibleReviews = window.innerWidth < 768 ? 1 : 3;
    let reviewItemWidth = reviewItems[0].getBoundingClientRect().width + 20;
    let maxReviewIndex = reviewItems.length - visibleReviews;

    function updateReviewsCarousel() {
      reviewsTrack.style.transform = `translateX(-${reviewIndex * reviewItemWidth}px)`;
      reviewsPrevBtn.disabled = reviewIndex === 0;
      reviewsNextBtn.disabled = reviewIndex >= maxReviewIndex;
    }

    reviewsPrevBtn.addEventListener('click', () => {
      if (reviewIndex > 0) {
        reviewIndex--;
        updateReviewsCarousel();
      }
    });

    reviewsNextBtn.addEventListener('click', () => {
      if (reviewIndex < maxReviewIndex) {
        reviewIndex++;
        updateReviewsCarousel();
      }
    });

    window.addEventListener('resize', () => {
      visibleReviews = window.innerWidth < 768 ? 1 : 3;
      reviewItemWidth = reviewItems[0].getBoundingClientRect().width + 20;
      maxReviewIndex = reviewItems.length - visibleReviews;
      if (reviewIndex > maxReviewIndex) {
        reviewIndex = maxReviewIndex;
      }
      updateReviewsCarousel();
    });

    updateReviewsCarousel();
  }

  // ================== TWO-FORM Toggle (Message / Booking) ==================
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  if (toggleBtns.length > 0) {
    const messageForm = document.getElementById('messageForm');
    const bookingForm = document.getElementById('bookingForm');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        toggleBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        if (this.dataset.form === 'booking') {
          messageForm.classList.remove('active-form');
          messageForm.classList.add('hidden-form');
          bookingForm.classList.remove('hidden-form');
          bookingForm.classList.add('active-form');
        } else {
          bookingForm.classList.remove('active-form');
          bookingForm.classList.add('hidden-form');
          messageForm.classList.remove('hidden-form');
          messageForm.classList.add('active-form');
        }
      });
    });
  }

  // ================== Navigation Overlay Functionality ==================
  const menuIcon = document.querySelector(".menu-icon");
  const closeButton = document.querySelector(".close-btn");
  const navOverlay = document.querySelector(".nav-overlay");
  const bodyElement = document.body;

  function toggleNav() {
    if (!navOverlay.classList.contains("active")) {
      navOverlay.classList.remove("inactive");
      navOverlay.classList.add("active");
      bodyElement.classList.add("no-scroll");
    } else {
      navOverlay.classList.remove("active");
      navOverlay.classList.add("inactive");
      bodyElement.classList.remove("no-scroll");
    }
  }

  if (menuIcon && closeButton && navOverlay) {
    menuIcon.addEventListener("click", toggleNav);
    closeButton.addEventListener("click", toggleNav);
  }

  // ================== (Optional) Tab Buttons for Menu Page ==================
  const tabButtons = document.querySelectorAll('.menu-tabs .tab-btn');
  const sections = document.querySelectorAll('.menu-section');
  if (tabButtons.length > 0 && sections.length > 0) {
    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        sections.forEach(sec => sec.style.display = 'none');
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).style.display = 'block';
      });
    });
  }

  // ================== Intersection Observer for Swipe Indicators ==================
  const options = {
    root: null,
    threshold: 0.2
  };

  function onSectionIntersect(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const indicator = entry.target.querySelector('.swipe-indicator');
        if (indicator) {
          indicator.classList.add('animate-indicator');
        }
        observer.unobserve(entry.target);
      }
    });
  }

  const observer = new IntersectionObserver(onSectionIntersect, options);
  const foodSection = document.querySelector('.our-food-section');
  if (foodSection) observer.observe(foodSection);
  const reviewsSection = document.querySelector('.reviews-section');
  if (reviewsSection) observer.observe(reviewsSection);

  // ================== Form Submission Handling ==================
  async function handleFormSubmit(form, e) {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        body: new URLSearchParams(formData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      showMessage(result.message, true);
      form.reset();
    } catch (error) {
      showMessage(error.message || 'Failed to send message. Please try again.', false);
      console.error('Form submission error:', error);
    }
  }

  const msgForm = document.getElementById('messageForm');
  const bkForm = document.getElementById('bookingForm');
  if (msgForm) {
    msgForm.addEventListener('submit', (e) => handleFormSubmit(msgForm, e));
  }
  if (bkForm) {
    bkForm.addEventListener('submit', (e) => handleFormSubmit(bkForm, e));
  }
});
