// Footer Loader - Max Boissiere
(function() {
    'use strict';
    
    const footerHTML = `
        <footer>
            <div class="footer-content">
                <div class="footer-social">
                    <a href="https://www.linkedin.com/in/max-boissiere-788115193/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://youtube.com/@max.boissiere" target="_blank" rel="noopener noreferrer">YouTube</a>
                    <a href="https://soundcloud.com/quiet-4444" target="_blank" rel="noopener noreferrer">SoundCloud</a>
                    <a href="https://instagram.com/max.boissiere" target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
                <p>&copy; 2026 Max Boissiere. All rights reserved.</p>
            </div>
        </footer>
    `;
    
    // Load footer when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = footerHTML;
        }
    });
})();
