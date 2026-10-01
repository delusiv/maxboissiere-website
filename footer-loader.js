// Footer Loader - Max Boissiere
function loadFooter() {
    // "#top" scrolls to the top of the page natively (smoothly, via scroll-behavior)
    const footerHTML = `
    <footer class="site-footer">
        <div class="grid">
            <p class="ft-name">Max Boissiere</p>
            <ul class="ft-social">
                <li><a href="https://www.linkedin.com/in/max-boissiere-788115193/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a href="https://youtube.com/@max.boissiere" target="_blank" rel="noopener noreferrer">YouTube</a></li>
                <li><a href="https://instagram.com/max.boissiere" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://soundcloud.com/quiet-4444" target="_blank" rel="noopener noreferrer">SoundCloud</a></li>
                <li><a href="mailto:max.boissiere@pictureup.co">Email</a></li>
            </ul>
            <p class="ft-copy">&copy; ${new Date().getFullYear()} Max Boissiere.<br>All rights reserved.</p>
            <a class="ft-top" href="#top">Back to top <span aria-hidden="true">&uarr;</span></a>
        </div>
    </footer>`;

    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) placeholder.outerHTML = footerHTML;
}

document.addEventListener('DOMContentLoaded', loadFooter);
