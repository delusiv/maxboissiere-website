// Header Loader - Max Boissiere
function loadHeader() {
    const inProject = window.location.pathname.includes('/projects/');
    const root = inProject ? '../' : './';

    const headerHTML = `
    <header class="site-header">
        <div class="grid">
            <a class="hd-name" href="${root}">Max Boissiere</a>
            <span class="hd-loc">Arizona, USA <span class="hd-clock" id="hdClock"></span></span>
            <nav class="hd-nav" aria-label="Primary">
                <a href="${inProject ? root : '#reel'}" data-section="reel"><span class="hd-num">01</span>${inProject ? 'Index' : 'Reel'}</a>
                <a href="${inProject ? root + '#work' : '#work'}" data-section="work"><span class="hd-num">02</span>Work</a>
                <a href="${inProject ? root + '#contact' : '#contact'}" data-section="contact"><span class="hd-num">03</span>Contact</a>
                <button class="theme-toggle" type="button" onclick="toggleTheme()" aria-label="Toggle light and dark theme">
                    <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>
                        <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>
                    </svg>
                    <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
                    </svg>
                </button>
                <span class="hd-indicator" aria-hidden="true"></span>
            </nav>
        </div>
    </header>`;

    const placeholder = document.getElementById('header-placeholder');
    if (placeholder) placeholder.outerHTML = headerHTML;
}

document.addEventListener('DOMContentLoaded', loadHeader);
