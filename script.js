// Max Boissiere - Awwwards-Level Portfolio
(function() {
    'use strict';

    // Ensure browser doesn't auto-restore on history in ways that conflict
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}

    // ================================
    // Custom cursor dot
    // ================================
    function initCursorDot() {
        if (window.matchMedia('(pointer:coarse)').matches) return;
        const dot = document.createElement('div');
        dot.className = 'cursor-dot';
        document.body.appendChild(dot);
        let mx = -100, my = -100, dx = -100, dy = -100;

        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            if (!dot.classList.contains('visible')) dot.classList.add('visible');
        });
        document.addEventListener('mouseleave', () => dot.classList.remove('visible'));

        (function render() {
            dx += (mx - dx) * 0.12;
            dy += (my - dy) * 0.12;
            dot.style.left = dx + 'px';
            dot.style.top = dy + 'px';
            requestAnimationFrame(render);
        })();

        // Expand on hoverable elements
        const hoverSelector = 'a, button, .gallery-item, .service-chips li, .cta-button, .still-item, .gallery-plus-item';
        document.addEventListener('mouseover', e => {
            if (e.target.closest(hoverSelector)) dot.classList.add('hovering');
        });
        document.addEventListener('mouseout', e => {
            if (e.target.closest(hoverSelector)) dot.classList.remove('hovering');
        });
    }

    // ================================
    // Scroll-triggered reveal animations
    // ================================
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

        document.querySelectorAll('.gallery-container, .project-details, .stills-gallery, .videos-container, .contact-form, footer').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // ================================
    // Magnetic hover on buttons
    // ================================
    function initMagneticElements() {
        if (window.matchMedia('(pointer:coarse)').matches) return;
        document.querySelectorAll('.cta-button, .theme-toggle').forEach(el => {
            el.addEventListener('mousemove', e => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                el.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
                el.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                setTimeout(() => el.style.transition = '', 600);
            });
        });
    }

    let customShuffle = null;
    let currentFilterIndex = 0;
    let prevNonContactIndex = 0; // track last non-contact filter index
    const filterStates = [
        { filter: '*', text: 'All' },
        { filter: 'dp', text: 'Director of Photography' },
        { filter: 'editor', text: 'Video Editor' },
        { filter: 'director', text: 'Director' },
        { filter: 'contact', text: 'Contact' }
    ];
    
    // Theme management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const themeToggle = document.querySelector('.theme-toggle');
        
        if (themeToggle) {
            // Add animation class based on current theme
            const animationClass = currentTheme === 'light' ? 'setting' : 'rising';
            themeToggle.classList.add(animationClass);
            
            // Change theme during the exchange (when outgoing icon is halfway down)
            setTimeout(() => {
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            }, 400);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                themeToggle.classList.remove(animationClass);
            }, 800);
        } else {
            // Fallback if button not found
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }
    }
    window.toggleTheme = toggleTheme;
    
    // Contact section
    function initContactSection() {
        const plusIcon = document.getElementById('galleryPlusIcon');
        const contactSection = document.getElementById('contactSection');
        
        if (!plusIcon || !contactSection) return;
        
        const toggleContactFilter = () => {
            const currentKey = filterStates[currentFilterIndex]?.filter;
            if (currentKey === 'contact') {
                // Requirement: when contact is open and plus is clicked, reset to default
                setFilterByKey('*');
            } else {
                // Remember current non-contact before entering contact
                if (currentKey !== 'contact') prevNonContactIndex = currentFilterIndex;
                setFilterByKey('contact');
            }
        };

        plusIcon.addEventListener('click', toggleContactFilter);
        
        plusIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleContactFilter();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && filterStates[currentFilterIndex]?.filter === 'contact') {
                const fallbackKey = filterStates[prevNonContactIndex]?.filter || '*';
                setFilterByKey(fallbackKey);
            }
        });
    }

    // Public helper to open contact section from CTA
    function openContactSection() {
        // Save previous non-contact index if needed
        if (filterStates[currentFilterIndex]?.filter !== 'contact') {
            prevNonContactIndex = currentFilterIndex;
        }
        // Force open immediately for reliability
        try {
            const plusIcon = document.getElementById('galleryPlusIcon');
            const section = document.getElementById('contactSection');
            if (plusIcon) plusIcon.classList.add('active');
            if (section) section.classList.add('active');
        } catch {}
        // Also set filter so gallery UI matches state
        setFilterByKey('contact');
        try {
            const el = document.getElementById('contactSection');
            if (el) {
                el.setAttribute('tabindex', '-1');
                el.focus({ preventScroll: true });
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
            }
        } catch {}
    }
    window.openContactSection = openContactSection;
    
    // Sequential loading animation
    function initSequentialLoading() {
        const loadItems = document.querySelectorAll('.load-item, h1, h2, h3, h4, h5, h6, p, .logo a, .nav-right, .video-container, .detail-section, .still-item, .service-category');
        
        loadItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('loaded');
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
    
    // Gallery item loading animation
    function initGalleryItemsLoading() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('loaded');
            }, index * 60);
        });
    }
    
    // Custom Shuffle.js-like implementation
    function initCustomShuffle() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;
        
        const galleryItems = gallery.querySelectorAll('.gallery-item');
        if (galleryItems.length === 0) return;
        
        let columns = 3; // Default for desktop

        // Calculate responsive columns
        function updateLayout() {
            const screenWidth = window.innerWidth;
            if (screenWidth <= 480) {
                columns = 1;
            } else if (screenWidth <= 768) {
                columns = 2;
            } else {
                columns = 3;
            }
            layoutItems();
        }
        
        // Layout items in masonry-style grid
        function layoutItems() {
            const visibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
            const columnHeights = new Array(columns).fill(0);
            
            // Get container dimensions without padding
            const containerStyle = window.getComputedStyle(gallery);
            const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
            const containerWidth = gallery.offsetWidth - paddingLeft - paddingRight;
            
            const gap = 16; // gap between tiles in px
            const itemWidthPx = (containerWidth - gap * (columns - 1)) / columns;
            const itemHeight = itemWidthPx * (9/16); // 16:9 aspect ratio

            visibleItems.forEach((item, index) => {
                // Find the shortest column
                const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

                // Position the item with gap
                const x = shortestColumn * (itemWidthPx + gap);
                const y = columnHeights[shortestColumn];

                item.style.transform = `translate(${x}px, ${y}px)`;
                item.style.width = `${itemWidthPx}px`;

                // Update column height (add gap below each tile)
                columnHeights[shortestColumn] += itemHeight + gap;
            });
            
            // Set container height with bottom padding
            const maxHeight = Math.max(...columnHeights);
            gallery.style.height = `${maxHeight + 32}px`; // Add 2rem bottom padding
        }
        
        // Initialize layout
        updateLayout();
        
        // Initialize gallery items loading animation after layout
        setTimeout(() => {
            initGalleryItemsLoading();
        }, 100);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            updateLayout();
        });
        
        // Return layout function for filtering
        return {
            layout: layoutItems,
            updateLayout: updateLayout
        };
    }
    
    // Colorful sparks animation — enhanced with mix of dots and streaks
    function createSparks(x, y) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = isDark ? ['#ffffff', '#e0e0e0', '#c0c0c0'] : ['#000000', '#1a1a1a', '#333333'];
        const sparkCount = 16;

        for (let i = 0; i < sparkCount; i++) {
            const spark = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const isStreak = Math.random() > 0.5;
            const size = isStreak ? `${1 + Math.random() * 2}px` : `${4 + Math.random() * 4}px`;
            const w = isStreak ? `${2 + Math.random() * 14}px` : size;
            spark.style.cssText = `
                position:fixed;width:${w};height:${size};
                background:${color};border-radius:${isStreak ? '2px' : '50%'};
                pointer-events:none;z-index:9999;
                left:${x}px;top:${y}px;
                box-shadow:0 0 8px ${color},0 0 16px ${color}40;
            `;

            document.body.appendChild(spark);

            const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.6;
            const distance = 40 + Math.random() * 120;
            const duration = 600 + Math.random() * 600;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const rot = isStreak ? `rotate(${angle * 180 / Math.PI}deg)` : '';

            spark.animate([
                { transform: `translate(0,0) scale(1) ${rot}`, opacity: 1 },
                { transform: `translate(${dx}px,${dy}px) scale(0) ${rot}`, opacity: 0 }
            ], {
                duration,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
            }).onfinish = () => spark.remove();
        }
    }

    // Helper to update filter toggle UI consistently
    function setFilterToggleUI(filterToggle, filterText, state) {
        if (!filterToggle) return;
        const filterIcon = filterToggle.querySelector('svg');
        if (filterText) {
            if (state.filter === '*') {
                if (filterIcon) filterIcon.style.display = 'block';
                filterText.style.display = 'none';
                filterText.textContent = '';
            } else {
                if (filterIcon) filterIcon.style.display = 'none';
                filterText.style.display = 'block';
                filterText.textContent = state.text;
            }
        }
        filterToggle.setAttribute('data-filter', state.filter);
    }

    // Central setter for filter state
    function setFilterByKey(key) {
        const idx = filterStates.findIndex(s => s.filter === key);
        if (idx === -1) return;
        currentFilterIndex = idx;
        const filterToggle = document.getElementById('filterToggle');
        const filterText = document.querySelector('.filter-text');
        const state = filterStates[currentFilterIndex];
        if (filterToggle) setFilterToggleUI(filterToggle, filterText, state);
        try { localStorage.setItem('portfolioFilterIndex', String(currentFilterIndex)); } catch {}
        applySimpleFilter(state.filter);
        syncServiceChips(state.filter);
    }

    // Filter functionality
    function restoreFilterState() {
        // If a previous navigation requested forcing default filter, honor it and exit early
        try {
            const forceDefault = sessionStorage.getItem('forceDefaultFilterV1');
            if (forceDefault === '1') {
                sessionStorage.removeItem('forceDefaultFilterV1');
                setFilterByKey('*');
                return;
            }
        } catch {}

        const savedIndex = localStorage.getItem('portfolioFilterIndex');
        const filterToggle = document.getElementById('filterToggle');
        const filterText = document.querySelector('.filter-text');
        
        if (savedIndex !== null) {
            const index = parseInt(savedIndex, 10);
            if (index >= 0 && index < filterStates.length) {
                currentFilterIndex = index;
                const currentState = filterStates[currentFilterIndex];
                
                if (filterToggle) setFilterToggleUI(filterToggle, filterText, currentState);
                
                // Apply filter with simple CSS Grid approach
                applySimpleFilter(currentState.filter);
                syncServiceChips(currentState.filter);
            }
        } else {
            // No saved state: ensure default '*' is applied to sync UI and layout
            if (filterToggle) setFilterToggleUI(filterToggle, filterText, filterStates[0]);
            applySimpleFilter('*');
            syncServiceChips('*');
        }
    }
    
    function applySimpleFilter(filter) {
        const galleryItems = document.querySelectorAll('.gallery-item');
        const contactSection = document.getElementById('contactSection');
        const plusIcon = document.getElementById('galleryPlusIcon');
        
        // First, fade out all items
        galleryItems.forEach(item => {
            item.classList.remove('loaded');
        });
        
        // After fade out, apply filter and re-layout
        setTimeout(() => {
            galleryItems.forEach(item => {
                const category = item.dataset.category;
                const isPlusItem = item.classList.contains('gallery-plus-item');
                
                if (filter === 'contact') {
                    // Contact state: show only plus button
                    if (isPlusItem) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                } else if (filter === '*' || isPlusItem || category === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
            
            // Handle contact section for contact filter
            if (filter === 'contact') {
                // Open contact section automatically
                if (contactSection && plusIcon) {
                    plusIcon.classList.add('active');
                    contactSection.classList.add('active');
                    setTimeout(() => {
                        contactSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }, 200);
                }
            } else {
                // Close contact section for other filters
                if (contactSection && plusIcon) {
                    plusIcon.classList.remove('active');
                    contactSection.classList.remove('active');
                }
            }
            
            // Re-layout items after filter change
            if (customShuffle) {
                customShuffle.layout();
            }
            
            // Animate visible items back in
            const visibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
            visibleItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('loaded');
                }, index * 60);
            });
        }, 200);
    }
    
    function initGalleryFilter() {
        const gallery = document.getElementById('gallery');
        let filterToggle = document.getElementById('filterToggle');
        let filterText = document.querySelector('.filter-text');
        
        // If header filter is absent, just restore state and skip wiring header UI
        if (!filterToggle) {
            restoreFilterState();
            return;
        }
        
        setupFilterLogic();
        restoreFilterState();
        
        function setupFilterLogic() {
            if (!gallery || !filterToggle) return;
            
            function saveFilterState() { localStorage.setItem('portfolioFilterIndex', currentFilterIndex.toString()); }
            
            filterToggle.addEventListener('click', (event) => {
                // Create sparks at click position (with error handling)
                try { const rect = filterToggle.getBoundingClientRect(); const x = event.clientX || rect.left + rect.width / 2; const y = event.clientY || rect.top + rect.height / 2; createSparks(x, y); } catch {}
                
                const wasContact = filterStates[currentFilterIndex]?.filter === 'contact';
                const prevIndex = currentFilterIndex;
                currentFilterIndex = (currentFilterIndex + 1) % filterStates.length;
                const newState = filterStates[currentFilterIndex];
                if (newState.filter === 'contact' && !wasContact) {
                    prevNonContactIndex = prevIndex;
                }
                setFilterByKey(newState.filter);
            });
        }
    }
    
    // Contact button handling
    function handleContactClick(event, email) {
        event.preventDefault();
        const button = event.target.closest('.cta-button');
        if (!button) return;
        
        if (!button.hasAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.textContent);
        }
        
        if (button.textContent === email) {
            copyToClipboard(email, button);
        } else {
            button.textContent = email;
            button.style.fontSize = '0.9rem';
        }
    }
    window.handleContactClick = handleContactClick;
    
    // Copy to clipboard
    function copyToClipboard(text, button) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showTooltip(button, 'Copied!');
            }).catch(() => {
                fallbackCopy(text, button);
            });
        } else {
            fallbackCopy(text, button);
        }
    }
    
    function fallbackCopy(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showTooltip(button, 'Copied!');
        } catch (err) {
            showTooltip(button, 'Copy failed');
        }
        
        document.body.removeChild(textArea);
    }
    
    function showTooltip(element, message) {
        const originalText = element.getAttribute('data-original-text') || element.textContent;
        element.textContent = message;
        element.style.backgroundColor = 'var(--text)';
        element.style.color = 'white';
        
        setTimeout(() => {
            element.textContent = originalText;
            element.style.backgroundColor = '';
            element.style.color = '';
        }, 2000);    }

    // Project details section animations
    function initProjectDetailsAnimations() {
        const detailSections = document.querySelectorAll('.detail-section');
        
        detailSections.forEach(section => {
            const listItems = section.querySelectorAll('li');
            
            section.addEventListener('mouseenter', () => {
                listItems.forEach((item, index) => {
                    item.style.transitionDelay = `${index * 0.03}s`;
                });
            });
            
            section.addEventListener('mouseleave', () => {
                listItems.forEach(item => {
                    item.style.transitionDelay = '0s';
                });
            });
        });
    }

    // Blog animations
    function initBlogAnimations() {
        const blogSections = document.querySelectorAll('.blog-section');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('loaded');
                }
            });
        }, { threshold: 0.1 });
        
        blogSections.forEach(section => {
            observer.observe(section);
        });
    }
    
    // Initialize everything
    function initializeGalleryFeatures() {
        // Simple initialization without complex timing issues
        const gallery = document.getElementById('gallery');
        const galleryItems = gallery ? gallery.querySelectorAll('.gallery-item') : [];
        
        if (gallery && galleryItems.length > 0) {
            customShuffle = initCustomShuffle();
            initGalleryFilter();
        } else {
            // If gallery isn't ready yet, try again after a short delay
            setTimeout(initializeGalleryFeatures, 100);
        }
    }

    // Attach reset behavior to the header logo link (works whether headerLoaded fired before or after)
    function attachLogoResetBehavior() {
        const logoLink = document.querySelector('.logo a');
        if (!logoLink) return;
        if (logoLink.dataset.resetAttached === '1') return;
        logoLink.dataset.resetAttached = '1';
        logoLink.addEventListener('click', () => {
            // If the current filter is contact, reset to default before navigation
            if (filterStates[currentFilterIndex]?.filter === 'contact') {
                try { sessionStorage.setItem('forceDefaultFilterV1', '1'); } catch {}
                setFilterByKey('*');
            }
        });
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initCursorDot();
        initContactSection();
        initSequentialLoading();
        initScrollReveal();
        initBlogAnimations();
        initProjectDetailsAnimations();
    initLocalDevLinkFix();
    // Install scroll preservation around arrow navigation
    initScrollPreserver();
    // Build and persist project order from the gallery when available
    persistProjectOrderFromGallery();
    // Inject and setup project navigation
    injectProjectNavs();
    initDynamicProjectNavigation();
        initFullscreenViewer();
    initServiceChipsFilter();
        // Inject dynamic GMT offset for Arizona (America/Phoenix) beneath location
        try { initIntroTimeZone(); } catch {}
        // Try to attach immediately in case header is already in DOM
        attachLogoResetBehavior();
        
        // Initialize gallery features
        initializeGalleryFeatures();

        // Magnetic hover on interactive elements (after DOM is populated)
        setTimeout(initMagneticElements, 200);

        // If URL targets the contact section (e.g., after form submit), open it
        if (window.location.hash === '#contactSection') {
            setTimeout(() => {
                try { openContactSection(); } catch {}
            }, 50);
        }
    });

    // Also attach when the header signals it has been injected
    document.addEventListener('headerLoaded', attachLogoResetBehavior);

    // ================================
    // Intro time zone (Arizona / America/Phoenix) dynamic GMT offset
    // ================================
    function getTimeZoneOffsetMinutes(timeZone, date = new Date()) {
        // Returns offset minutes relative to UTC (e.g., -420 for GMT-7)
        const dtf = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
        const parts = dtf.formatToParts(date);
        const map = {};
        for (const { type, value } of parts) {
            if (type !== 'literal') map[type] = value;
        }
        const asUTC = Date.UTC(
            Number(map.year),
            Number(map.month) - 1,
            Number(map.day),
            Number(map.hour),
            Number(map.minute),
            Number(map.second)
        );
        const asTS = date.getTime();
        return (asUTC - asTS) / 60000;
    }

    function initIntroTimeZone() {
        const el = document.querySelector('.intro-time');
        if (!el) return;
        try {
            const offsetMin = Math.round(getTimeZoneOffsetMinutes('America/Phoenix'));
            const sign = offsetMin > 0 ? '+' : (offsetMin < 0 ? '-' : '');
            const abs = Math.abs(offsetMin);
            const hours = Math.floor(abs / 60);
            const minutes = abs % 60;
            const pretty = minutes ? `${hours}:${String(minutes).padStart(2, '0')}` : `${hours}`;
            el.textContent = `GMT ${sign}${pretty}`;
            el.setAttribute('title', 'America/Phoenix');
        } catch {
            // Fallback: leave existing text (e.g., previously hardcoded)
        }
    }
    
    // Lusion.co-inspired fullscreen viewer with pixel peeping
    function initFullscreenViewer() {
        const stillImages = document.querySelectorAll('.still-item img');
        
        stillImages.forEach(img => {
            // Prevent double-initialization
            if (img.dataset.viewerInit === '1') return;
            img.dataset.viewerInit = '1';
            img.style.cursor = 'zoom-in';
            img.title = 'Click to view fullscreen';
            
            img.addEventListener('click', (e) => {
                e.preventDefault();
                createLusionViewer(img);
            });
        });
    }

    function createLusionViewer(img) {
        // Get current theme for background
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const overlayBg = currentTheme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(128,128,128,0.95)';
        
        // Create overlay with theme-dependent background
        const overlay = document.createElement('div');
        overlay.className = 'lusion-viewer';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: ${overlayBg}; z-index: 10000;
            opacity: 0; transition: opacity 0.4s cubic-bezier(0.19,1,0.22,1);
            cursor: grab; overflow: hidden; user-select: none;
        `;
        
        // Image container for transforms
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
            transform: scale(0.95); transition: transform 0.6s cubic-bezier(0.19,1,0.22,1);
        `;
        
        // The main image
        const fullscreenImg = document.createElement('img');
        fullscreenImg.src = img.src;
        fullscreenImg.alt = img.alt;
        fullscreenImg.style.cssText = `
            max-width: 85vw; max-height: 85vh; object-fit: contain; cursor: zoom-in;
            transition: all 0.4s cubic-bezier(0.19,1,0.22,1); border-radius: 4px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5); transform-origin: center;
        `;
        fullscreenImg.draggable = false;
        
        // Close button with minimal design
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute; top: 30px; right: 30px; width: 44px; height: 44px;
            border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; background: rgba(0,0,0,0.4);
            color: white; font-size: 20px; font-weight: 300; cursor: pointer; z-index: 10001;
            display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);
            transition: all 0.3s cubic-bezier(0.19,1,0.22,1); opacity: 0.7;
        `;
        
        // Zoom indicator
        const zoomIndicator = document.createElement('div');
        zoomIndicator.style.cssText = `
            position: absolute; bottom: 30px; left: 30px; padding: 8px 16px;
            background: rgba(0,0,0,0.4); color: white; border-radius: 20px;
            font-size: 12px; font-weight: 400; backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1); opacity: 0;
            transition: opacity 0.3s ease; pointer-events: auto; cursor: pointer;
        `;
        zoomIndicator.textContent = '100%';
        
        // Zoom slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            position: absolute; bottom: 80px; left: 30px; width: 200px;
            background: rgba(0,0,0,0.4); border-radius: 25px; padding: 15px 20px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
            opacity: 0; pointer-events: none; transition: all 0.3s ease;
            transform: translateY(10px);
        `;
        
        // Slider label
        const sliderLabel = document.createElement('div');
        sliderLabel.style.cssText = `
            color: white; font-size: 11px; font-weight: 300; margin-bottom: 10px;
            text-align: center; opacity: 0.8;
        `;
        sliderLabel.textContent = 'Zoom Level';
        
        // Zoom slider
        const zoomSlider = document.createElement('input');
        zoomSlider.type = 'range';
        zoomSlider.min = '50';
        zoomSlider.max = '500';
        zoomSlider.value = '100';
        zoomSlider.step = '10';
        zoomSlider.style.cssText = `
            width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.2);
            outline: none; appearance: none; -webkit-appearance: none;
        `;
        
        // Slider track styling (inject once)
        let sliderStyle = document.getElementById('zoom-slider-style');
        if (!sliderStyle) {
            sliderStyle = document.createElement('style');
            sliderStyle.id = 'zoom-slider-style';
            sliderStyle.textContent = `
            .zoom-slider::-webkit-slider-thumb {
                appearance: none; width: 16px; height: 16px; border-radius: 50%;
                background: white; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            .zoom-slider::-moz-range-thumb {
                width: 16px; height: 16px; border-radius: 50%; background: white;
                cursor: pointer; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
        `;
            document.head.appendChild(sliderStyle);
        }
        zoomSlider.className = 'zoom-slider';
        
        // Slider value display
        const sliderValue = document.createElement('div');
        sliderValue.style.cssText = `
            color: white; font-size: 11px; font-weight: 400; text-align: center;
            margin-top: 8px; opacity: 0.9;
        `;
        sliderValue.textContent = '100%';
        
        // Assemble slider
        sliderContainer.appendChild(sliderLabel);
        sliderContainer.appendChild(zoomSlider);
        sliderContainer.appendChild(sliderValue);
        
        // Instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: absolute; bottom: 30px; right: 30px; padding: 8px 16px;
            background: rgba(0,0,0,0.4); color: rgba(255,255,255,0.8); border-radius: 20px;
            font-size: 11px; font-weight: 300; backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1); opacity: 0;
            transition: opacity 0.3s ease; pointer-events: none; text-align: right;
        `;
        instructions.innerHTML = 'Click to zoom • Drag to pan • Scroll to zoom • ESC to close';
        
        // Zoom and pan state
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let dragStarted = false;
        let lastX = 0;
        let lastY = 0;
        
        // Update transform
        const updateTransform = () => {
            fullscreenImg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
            const zoomPercentage = Math.round(scale * 100);
            zoomIndicator.textContent = `${zoomPercentage}%`;
            sliderValue.textContent = `${zoomPercentage}%`;
            zoomSlider.value = zoomPercentage;
            
            // Show/hide zoom indicator based on zoom level
            if (scale > 1) {
                zoomIndicator.style.opacity = '1';
                fullscreenImg.style.cursor = 'grab';
            } else {
                zoomIndicator.style.opacity = '0.6';
                fullscreenImg.style.cursor = 'zoom-in';
            }
            
            // Update overlay cursor based on state
            if (isDragging) {
                overlay.style.cursor = 'grabbing';
                fullscreenImg.style.cursor = 'grabbing';
            } else if (scale > 1) {
                overlay.style.cursor = 'grab';
            } else {
                overlay.style.cursor = 'zoom-in';
            }
        };
        
        // Zoom functionality
        const zoom = (factor, clientX, clientY) => {
            const rect = fullscreenImg.getBoundingClientRect();
            const x = clientX - rect.left - rect.width / 2;
            const y = clientY - rect.top - rect.height / 2;
            
            const newScale = Math.max(0.5, Math.min(scale * factor, 5));
            const scaleFactor = newScale / scale;
            
            translateX = translateX * scaleFactor - x * (scaleFactor - 1) / scale;
            translateY = translateY * scaleFactor - y * (scaleFactor - 1) / scale;
            scale = newScale;
            
            // Constrain panning
            const maxTranslateX = (rect.width * (scale - 1)) / 2;
            const maxTranslateY = (rect.height * (scale - 1)) / 2;
            translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
            translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
            
            updateTransform();
        };
        
        // Set zoom to specific percentage
        const setZoom = (percentage) => {
            const newScale = percentage / 100;
            const rect = fullscreenImg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            scale = Math.max(0.5, Math.min(newScale, 5));
            
            // Reset position when zooming out to 100% or less
            if (scale <= 1) {
                translateX = 0;
                translateY = 0;
            } else {
                // Constrain panning for new scale
                const maxTranslateX = (rect.width * (scale - 1)) / 2;
                const maxTranslateY = (rect.height * (scale - 1)) / 2;
                translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
                translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
            }
            
            updateTransform();
        };
        
        // Zoom indicator click to show/hide slider
        zoomIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = sliderContainer.style.opacity === '1';
            if (isVisible) {
                sliderContainer.style.opacity = '0';
                sliderContainer.style.pointerEvents = 'none';
                sliderContainer.style.transform = 'translateY(10px)';
            } else {
                sliderContainer.style.opacity = '1';
                sliderContainer.style.pointerEvents = 'auto';
                sliderContainer.style.transform = 'translateY(0)';
            }
        });
        
        // Slider input event
        zoomSlider.addEventListener('input', (e) => {
            const percentage = parseInt(e.target.value);
            setZoom(percentage);
        });
        
        // Hide slider when clicking elsewhere
        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                sliderContainer.style.opacity = '0';
                sliderContainer.style.pointerEvents = 'none';
                sliderContainer.style.transform = 'translateY(10px)';
                closeViewer();
            }
        };
        
        // Mouse events
        fullscreenImg.addEventListener('click', (e) => {
            // Only zoom if we didn't just finish dragging
            if (!dragStarted && scale === 1) {
                zoom(2, e.clientX, e.clientY);
            } else if (!dragStarted && scale > 1) {
                scale = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
            }
            // Reset drag flag after a short delay
            setTimeout(() => {
                dragStarted = false;
            }, 100);
        });
        
        fullscreenImg.addEventListener('mousedown', (e) => {
            if (scale > 1) {
                isDragging = true;
                dragStarted = false;
                lastX = e.clientX;
                lastY = e.clientY;
                updateTransform();
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && scale > 1) {
                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;
                
                // Mark that we've started dragging if movement is significant
                if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                    dragStarted = true;
                }
                
                translateX += deltaX / scale;
                translateY += deltaY / scale;
                lastX = e.clientX;
                lastY = e.clientY;
                updateTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                updateTransform();
            }
        });
        
        // Wheel zoom
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            zoom(factor, e.clientX, e.clientY);
        });
        
        // Close functionality
        const closeViewer = () => {
            overlay.style.opacity = '0';
            imageContainer.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                    document.body.style.overflow = originalOverflow;
                    document.removeEventListener('keydown', handleKeydown);
                }
            }, 400);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') closeViewer();
        };
        
        // Close button events
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.1)';
            closeBtn.style.opacity = '1';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(0,0,0,0.4)';
            closeBtn.style.opacity = '0.7';
        });
        closeBtn.addEventListener('click', closeViewer);
        
        // Background click to close
        overlay.addEventListener('click', handleOverlayClick);
        
        // Assemble and show
        imageContainer.appendChild(fullscreenImg);
        overlay.appendChild(imageContainer);
        overlay.appendChild(closeBtn);
        overlay.appendChild(zoomIndicator);
        overlay.appendChild(sliderContainer);
        overlay.appendChild(instructions);
        document.body.appendChild(overlay);
        
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeydown);
        
        // Initialize display
        updateTransform();
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            imageContainer.style.transform = 'scale(1)';
            setTimeout(() => {
                instructions.style.opacity = '0.8';
                setTimeout(() => {
                    instructions.style.opacity = '0';
                }, 3000);
            }, 1000);
        });
    }

    // Append .html to extensionless internal links when running locally (Live Server)
    function initLocalDevLinkFix() {
        const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
        if (!isLocal) return;

        const anchors = document.querySelectorAll('a[href]');
        anchors.forEach(a => {
            const href = a.getAttribute('href');
            if (!href) return;

            // Skip external/anchors/mailto
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('#')) return;

            // Skip root/back links and directories
            if (href.endsWith('/')) return;

            // Already has an extension
            if (/\.[a-zA-Z0-9]+(\?|#|$)/.test(href)) return;

            // Likely internal project link (e.g., projects/acyr or rei)
            // Avoid modifying query/hash only links
            if (!href.includes('?') && !href.includes('#')) {
                a.setAttribute('href', href + '.html');
            }
        });
    }

    // (Removed duplicate DOMContentLoaded listener for initFullscreenViewer; already initialized above)

    // ================================
    // Dynamic project navigation (Prev/Next with wrap-around)
    // ================================
    const PROJECT_ORDER_KEY = 'projectOrderSlugsV1';

    // Extract slugs from the home gallery and persist to localStorage
    function persistProjectOrderFromGallery() {
        try {
            const gallery = document.getElementById('gallery');
            if (!gallery) return;
            const anchors = gallery.querySelectorAll('.gallery-item:not(.gallery-plus-item) a[href*="projects/"]');
            const slugs = Array.from(anchors)
                .map(a => {
                    const href = a.getAttribute('href') || '';
                    // Expect formats like "projects/rei" or "projects/rei.html"
                    const after = href.split('projects/')[1] || '';
                    const slug = after.replace(/\/.*/, '')  // safety: only take last segment
                                     .replace(/\.html?(#.*|\?.*)?$/, '');
                    return slug;
                })
                .filter(Boolean);
            if (slugs.length) {
                localStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(slugs));
            }
        } catch (e) {
            // ignore
        }
    }

    function getProjectOrder() {
        // Try stored order first
        try {
            const saved = localStorage.getItem(PROJECT_ORDER_KEY);
            if (saved) {
                const arr = JSON.parse(saved);
                if (Array.isArray(arr) && arr.length) return arr;
            }
        } catch {}

        // Fallback to a reasonable default (kept in sync with index order)
        return [
            'acyr',
            'rei',
            'nami',
            'asu',
            'sah',
            'goat',
            'shitpost',
            'pj',
            'chatgpt',
            'blog-06-29-25',
            'granite-reef'
        ];
    }

    function getCurrentProjectSlug() {
        try {
            // URL patterns supported: /projects/<slug> or /projects/<slug>.html
            const parts = window.location.pathname.split('/').filter(Boolean);
            const idx = parts.lastIndexOf('projects');
            if (idx >= 0 && idx < parts.length - 1) {
                const last = parts[idx + 1];
                return last.replace(/\.html?$/, '');
            }
            // If running via file:// or unusual host, try last segment
            const last = parts[parts.length - 1] || '';
            return last.replace(/\.html?$/, '');
        } catch {
            return '';
        }
    }

    function initDynamicProjectNavigation() {
        // Only on project/blog pages under /projects/
        if (!/\/projects\//.test(window.location.pathname)) return;

        const order = getProjectOrder();
        const slug = getCurrentProjectSlug();
        const currentIdx = order.indexOf(slug);
        if (currentIdx === -1 || order.length === 0) return;

        const prevSlug = order[(currentIdx - 1 + order.length) % order.length];
        const nextSlug = order[(currentIdx + 1) % order.length];

        // Update top and bottom navs if present
        const navs = document.querySelectorAll('.project-nav-top, .project-nav');
        navs.forEach(nav => {
            const backLink = nav.querySelector('a.back-link');
            const nextLink = nav.querySelector('a.next-link');
            if (backLink) backLink.setAttribute('href', prevSlug);
            if (nextLink) nextLink.setAttribute('href', nextSlug);
        });

        // Re-run local dev link fix so .html is appended when needed
        try { initLocalDevLinkFix(); } catch {}
    }

    // ================================
    // Auto-inject project navigation markup
    // ================================
    function injectProjectNavs() {
        if (!/\/projects\//.test(window.location.pathname)) return;
        const prevSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const nextSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const build = (cls) => `<div class="${cls}"><a href="../" class="back-link">${prevSvg} Previous</a><a href="../" class="next-link">Next ${nextSvg}</a></div>`;
        const top = document.getElementById('nav-top');
        const bot = document.getElementById('nav-bottom');
        if (top) top.outerHTML = build('project-nav-top');
        if (bot) bot.outerHTML = build('project-nav');
    }

    // ================================
    // Scroll preservation across page transitions
    // ================================
    const SCROLL_STATE_KEY = 'pendingScrollRestoreV1';

    function saveScrollStateForNextPage() {
        try {
            const doc = document.documentElement;
            const maxScroll = Math.max(0, (doc.scrollHeight || 0) - window.innerHeight);
            const y = window.scrollY || window.pageYOffset || 0;
            const ratio = maxScroll > 0 ? Math.max(0, Math.min(1, y / maxScroll)) : 0;
            const payload = {
                t: Date.now(),
                y,
                ratio,
                viewport: { h: window.innerHeight },
                docH: doc.scrollHeight || 0
            };
            sessionStorage.setItem(SCROLL_STATE_KEY, JSON.stringify(payload));
        } catch {}
    }

    function restoreScrollStateIfAny() {
        let raw;
        try { raw = sessionStorage.getItem(SCROLL_STATE_KEY); } catch {}
        if (!raw) return;

        let data;
        try { data = JSON.parse(raw); } catch { data = null; }
        if (!data) return;

        // Remove immediately to avoid re-applying on further navs
        try { sessionStorage.removeItem(SCROLL_STATE_KEY); } catch {}

        const apply = () => {
            const doc = document.documentElement;
            const maxScroll = Math.max(0, (doc.scrollHeight || 0) - window.innerHeight);
            // Prefer ratio for different-length pages; fallback to absolute y
            let target = Math.round(maxScroll * (typeof data.ratio === 'number' ? data.ratio : 0));
            if (maxScroll > 0 && target === 0 && (data.y || 0) > 0) {
                target = Math.min(maxScroll, data.y);
            }
            window.scrollTo({ top: target, left: 0, behavior: 'auto' });
        };

        // Try a few times as content loads and layout changes
        requestAnimationFrame(apply);
        setTimeout(apply, 100);
        window.addEventListener('load', () => setTimeout(apply, 0), { once: true });
    }

    function initScrollPreserver() {
        // Restore if we have a pending state
        restoreScrollStateIfAny();

        // Save on arrow clicks
        document.addEventListener('click', (e) => {
            const a = e.target && e.target.closest && e.target.closest('a.next-link, a.back-link');
            if (!a) return;
            // Same-origin navigation only
            try {
                const url = new URL(a.href, window.location.href);
                if (url.origin !== window.location.origin) return;
            } catch { return; }
            saveScrollStateForNextPage();
            // Don't prevent default; allow normal navigation
        }, true);
    }


    // ================================
    // Service chips -> gallery filter bridge
    // ================================
    function initServiceChipsFilter() {
        const chipList = document.querySelector('.service-chips');
        if (!chipList) return;
        const chips = chipList.querySelectorAll('li[data-filter]');
        if (!chips.length) return;

        const activate = (chip, evt) => {
            const key = chip.getAttribute('data-filter') || '*';
            // Map chip filters to gallery categories
            // dp/editor/director/contact are supported; '*' shows all
            // Create sparks at click/focus position similar to filter toggle
            try {
                const rect = chip.getBoundingClientRect();
                const x = (evt && evt.clientX) ? evt.clientX : rect.left + rect.width / 2;
                const y = (evt && evt.clientY) ? evt.clientY : rect.top + rect.height / 2;
                createSparks(x, y);
            } catch {}
            setFilterByKey(key);
        };

        chips.forEach(chip => {
            chip.addEventListener('click', (e) => activate(chip, e));
            chip.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate(chip, e);
                }
            });
        });
        // Initial sync (if restore ran before DOMContentLoaded, we sync again here)
        const current = filterStates[currentFilterIndex]?.filter || '*';
        syncServiceChips(current);
    }

    function syncServiceChips(activeKey) {
        const chips = document.querySelectorAll('.service-chips li[data-filter]');
        if (!chips.length) return;
        chips.forEach(chip => {
            const key = chip.getAttribute('data-filter');
            const on = key === activeKey; // include '*' (All) as an active state
            chip.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    // ================================
    // Magnetic effect on filter chips
    // ================================
    (function initMagneticChips() {
        const chips = document.querySelectorAll('.service-chips li');
        const strength = 0.12;
        chips.forEach(chip => {
            chip.addEventListener('mousemove', e => {
                const rect = chip.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width / 2);
                const dy = e.clientY - (rect.top + rect.height / 2);
                chip.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
            });
            chip.addEventListener('mouseleave', () => {
                chip.style.transform = '';
            });
        });
    })();
})();
