// Header Loader - Final Optimized Version
function loadHeader() {
    // Filter control removed from header; service chips now control filtering.
    const filterContent = '';
    const headerHTML = `
    <header>
        <nav>
            <div class="nav-left">
                <div class="logo">
                    <a href="${window.location.pathname.includes('/projects/') ? '../' : './'}">Max Boissiere</a>
                </div>${filterContent}
            </div>
            <div class="nav-right">
                <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
                    <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>
                        <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>
                    </svg>
                    <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
                    </svg>
                </button>
            </div>
        </nav>
    </header>`;

    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHTML;
        
        // Dispatch custom event to signal header is loaded
        const headerLoadedEvent = new CustomEvent('headerLoaded');
        document.dispatchEvent(headerLoadedEvent);

        // Ensure clicking the logo resets gallery filter to default on next load
        try {
            const logoLink = headerPlaceholder.querySelector('.logo a');
            if (logoLink) {
                logoLink.addEventListener('click', () => {
                    try {
                        // Force default state on next page render
                        sessionStorage.setItem('forceDefaultFilterV1', '1');
                        // Also persist default index immediately
                        localStorage.setItem('portfolioFilterIndex', '0');
                    } catch {}
                }, { capture: true }); // capture to run as early as possible
            }
        } catch {}
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
});
