// public/js/shared/image-handler.js

/**
 * Handles image loading errors by replacing broken images with a fallback placeholder.
 * @param {HTMLImageElement} img - The image element that failed to load.
 */
window.handleImageError = function(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = '/assets/placeholder-furniture.jpg'; // Path to your local fallback
    img.classList.add('image-fallback');
};

/**
 * Global initialization for all images to prevent layout shifts and handle errors.
 */
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Add a skeleton loading class while image is not complete
        if (!img.complete) {
            img.classList.add('img-loading');
            img.onload = () => img.classList.remove('img-loading');
        }

        // Attach error handler if not already present
        if (!img.getAttribute('onerror')) {
            img.onerror = () => window.handleImageError(img);
        }
    });
});
