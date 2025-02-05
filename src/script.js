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

    // Food Carousel (Our Food Section)
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
});
