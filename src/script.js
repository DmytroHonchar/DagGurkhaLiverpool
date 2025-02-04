document.addEventListener("DOMContentLoaded", function () {
    // ================== Parallax Hero Effect ==================
    window.addEventListener("scroll", function () {
        const scrollPosition = window.scrollY;
        const heroBackground = document.querySelector(".hero-background");
        if (heroBackground) {
            const maxParallax = 80;
            const verticalParallax = Math.min(scrollPosition * 0.1, maxParallax);
            const scaleAmount = 1.1 - scrollPosition * 0.0001;
            const brightness = 1 + Math.min(scrollPosition * 0.0005, 0.1);
            const contrast = 1 + Math.min(scrollPosition * 0.0003, 0.05);

            requestAnimationFrame(() => {
                heroBackground.style.transform = `scale(${scaleAmount}) translateY(${verticalParallax}px)`;
                heroBackground.style.filter = `brightness(${brightness}) contrast(${contrast})`;
            });
        }
    });

    // ================== Food Carousel ==================
    const foodTrack = document.querySelector('.carousel-track');
    if (foodTrack) {
        const slides = Array.from(document.querySelectorAll('.carousel-item'));
        const prevButton = document.querySelector('.prev-btn');
        const nextButton = document.querySelector('.next-btn');

        const slidesToShow = 3;
        let currentFoodIndex = 0;
        let slideWidth = slides[0].getBoundingClientRect().width;
        const trackStyle = window.getComputedStyle(foodTrack);
        const gap = parseFloat(trackStyle.columnGap) || 0;
        const step = slideWidth + gap;
        const maxIndex = slides.length - slidesToShow;

        function updateFoodCarousel() {
            foodTrack.style.transform = `translateX(-${currentFoodIndex * step}px)`;
        }

        nextButton.addEventListener('click', () => {
            if (currentFoodIndex < maxIndex) {
                currentFoodIndex++;
                updateFoodCarousel();
            }
        });

        prevButton.addEventListener('click', () => {
            if (currentFoodIndex > 0) {
                currentFoodIndex--;
                updateFoodCarousel();
            }
        });

        window.addEventListener('resize', () => {
            slideWidth = slides[0].getBoundingClientRect().width;
            const newGap = parseFloat(window.getComputedStyle(foodTrack).columnGap) || 0;
            const newStep = slideWidth + newGap;
            foodTrack.style.transform = `translateX(-${currentFoodIndex * newStep}px)`;
        });
    }

   // Reviews Carousel
   const reviewsTrack = document.querySelector('.reviews-track');
   if (reviewsTrack) {
       const reviewsPrevBtn = document.getElementById('reviewsPrevBtn');
       const reviewsNextBtn = document.getElementById('reviewsNextBtn');
       const reviewItems = document.querySelectorAll('.review-item');

       let currentReviewIndex = 0;
       let visibleReviews = window.innerWidth < 768 ? 1 : 3;
       let reviewItemWidth = reviewItems[0].offsetWidth + 20; // 20px gap
       let maxReviewIndex = reviewItems.length - visibleReviews;

       function updateReviewsCarousel() {
           const translateX = -currentReviewIndex * reviewItemWidth;
           reviewsTrack.style.transform = `translateX(${translateX}px)`;
           reviewsPrevBtn.disabled = currentReviewIndex === 0;
           reviewsNextBtn.disabled = currentReviewIndex >= maxReviewIndex;
       }

       reviewsPrevBtn.addEventListener('click', () => {
           if (currentReviewIndex > 0) {
               currentReviewIndex--;
               updateReviewsCarousel();
           }
       });

       reviewsNextBtn.addEventListener('click', () => {
           if (currentReviewIndex < maxReviewIndex) {
               currentReviewIndex++;
               updateReviewsCarousel();
           }
       });

       window.addEventListener('resize', () => {
           visibleReviews = window.innerWidth < 768 ? 1 : 3;
           reviewItemWidth = reviewItems[0].offsetWidth + 20;
           maxReviewIndex = reviewItems.length - visibleReviews;

           if (currentReviewIndex > maxReviewIndex) {
               currentReviewIndex = maxReviewIndex;
           }

           updateReviewsCarousel();
       });

       updateReviewsCarousel();
   }
});
