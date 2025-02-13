document.addEventListener("DOMContentLoaded", function () {
    // ================== Parallax Hero Effect ==================
    window.addEventListener("scroll", function () {
      const scrollPosition = window.scrollY;
      const heroBackground = document.querySelector(".hero-background");
      if (heroBackground) {
        const maxParallax = 120; // increased maximum
        const verticalParallax = Math.min(scrollPosition * 0.25, maxParallax);
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
  
        // Update button states
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
  
        // Adjust currentIndex if it's beyond new maxIndex
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
      // Add 20px gap (same as defined in CSS) to the width
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
  
    // ================== Contact Form Toggle (Send Message / Book a Table) ==================
    // Only run this code if we're on the contact page (i.e., these elements exist)
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    if (toggleBtns.length > 0) {
      const messageFields = document.querySelector('.message-fields');
      const bookingFields = document.querySelector('.booking-fields');
      const formType = document.querySelector('input[name="form_type"]');
      const submitBtn = document.getElementById('submitBtn');
      // The booking fields that need required toggling
      const bookingRequired = document.querySelectorAll('.booking-fields input, .booking-fields select');
      const messageRequired = document.querySelector('#message');
  
      toggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          // Remove 'active' class from all toggle buttons
          toggleBtns.forEach(b => b.classList.remove('active'));
          // Add 'active' to the clicked button
          this.classList.add('active');
  
          const formMode = this.dataset.form;
          if (formMode === 'booking') {
            // Show booking fields, hide message fields
            bookingFields.style.display = 'block';
            messageFields.style.display = 'none';
  
            // Update the hidden form_type
            formType.value = 'booking';
            // Update the button text
            submitBtn.textContent = 'Book Table';
  
            // Add required to booking fields
            bookingRequired.forEach(el => el.setAttribute('required', ''));
            // Remove required from message
            messageRequired.removeAttribute('required');
  
          } else {
            // Show message fields, hide booking fields
            bookingFields.style.display = 'none';
            messageFields.style.display = 'block';
  
            // Update the hidden form_type
            formType.value = 'message';
            // Update the button text
            submitBtn.textContent = 'Send Message';
  
            // Remove required from booking fields
            bookingRequired.forEach(el => el.removeAttribute('required'));
            // Add required to message
            messageRequired.setAttribute('required','');
          }
        });
      });
    }

  // ================== Navigation Overlay Functionality ==================
  const menuIcon = document.querySelector(".menu-icon");
  const closeButton = document.querySelector(".close-btn");
  const navOverlay = document.querySelector(".nav-overlay");
  const bodyElement = document.body;

  if (menuIcon && closeButton && navOverlay) {
    menuIcon.addEventListener("click", toggleNav);
    closeButton.addEventListener("click", toggleNav);
  }

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


  const tabButtons = document.querySelectorAll('.menu-tabs .tab-btn');
  const sections = document.querySelectorAll('.menu-section');

  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Hide all sections
      sections.forEach(sec => sec.style.display = 'none');

      // Activate clicked button and display its target section
      this.classList.add('active');
      const targetId = this.getAttribute('data-target');
      document.getElementById(targetId).style.display = 'block';
    });
  });
  
  });
  

  