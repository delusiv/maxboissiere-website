// Max Boissiere - Portfolio
(function() {
    'use strict';

    history.scrollRestoration = 'manual';

    const REEL_ID = '1180727658';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ================================
    // Theme
    // ================================
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.classList.add('theme-transitioning');
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch {}
        setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
    }
    window.toggleTheme = toggleTheme;

    // ================================
    // Smooth scroll (Lenis): inertial wheel scrolling, touch stays native
    // ================================
    let lenis = null;

    function initSmoothScroll() {
        if (reducedMotion || !window.Lenis) return;
        lenis = new window.Lenis({ lerp: 0.08 });
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);

        // Same-page anchors glide with the same easing
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            const hash = a && a.getAttribute('href');
            if (!hash || hash.length < 2) return;
            const target = hash === '#top' ? 0 : document.querySelector(hash);
            if (target === null) return;
            e.preventDefault();
            lenis.scrollTo(target);
        });
    }

    // Freeze the page behind overlays
    function lockScroll(on) {
        document.body.classList.toggle('no-scroll', on);
        if (lenis) on ? lenis.stop() : lenis.start();
    }

    // ================================
    // Hero reel: progress bar + sound dialog
    // ================================
    function pad(n) { return String(n).padStart(2, '0'); }

    // Scrolling out of the hero: the reel sinks, zooms and darkens while the
    // title lifts away, so the next section slides over it like a curtain
    function initHeroMotion() {
        const hero = document.querySelector('.hero');
        if (!hero || reducedMotion) return;
        const update = () => {
            const p = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
            hero.style.setProperty('--p', p.toFixed(4));
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        // Intro: reveal the name, then roles and buttons, once the page has painted
        hero.classList.add('is-intro');
        requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
    }

    function initHeroReel() {
        const hero = document.querySelector('.hero');
        const iframe = document.getElementById('heroReel');
        if (!hero || !iframe) return;

        let player = null;
        if (!window.Vimeo) {
            // Player API unavailable: just reveal the background video
            hero.classList.add('is-playing');
        } else {
            const bar = document.getElementById('hudBar');
            player = new window.Vimeo.Player(iframe);
            player.on('play', () => hero.classList.add('is-playing'));
            player.on('timeupdate', (data) => { bar.style.transform = `scaleX(${data.percent || 0})`; });
            // Pause the background reel when it scrolls out of view
            new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) player.play().catch(() => {});
                else player.pause().catch(() => {});
            }, { threshold: 0.05 }).observe(hero);
        }

        initReelDialog(player);
    }

    function initReelDialog(player) {
        const dialog = document.getElementById('reelDialog');
        const frame = dialog.querySelector('.reel-frame');

        document.getElementById('playReel').addEventListener('click', () => {
            frame.innerHTML = `<iframe src="https://player.vimeo.com/video/${REEL_ID}?autoplay=1&badge=0&title=0&byline=0&portrait=0&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Showreel"></iframe>`;
            if (player) player.pause().catch(() => {});
            dialog.showModal();
            lockScroll(true);
        });
        document.getElementById('closeReel').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
        dialog.addEventListener('close', () => {
            frame.innerHTML = '';
            lockScroll(false);
            if (player) player.play().catch(() => {});
        });
    }

    function initLocalClock() {
        const el = document.getElementById('hdClock');
        if (!el) return;
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Phoenix', hour: '2-digit', minute: '2-digit', hour12: false
        });
        const tick = () => { el.textContent = `${fmt.format(new Date())} MST`; };
        tick();
        setInterval(tick, 15000);
    }

    // Header gets a solid background once the reel is scrolled past
    function initHeaderState() {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const hero = document.querySelector('.hero');
        let ticking = false;
        const update = () => {
            ticking = false;
            const solid = hero
                ? hero.getBoundingClientRect().bottom <= header.offsetHeight
                : window.scrollY > 8;
            header.classList.toggle('is-solid', solid);
        };
        const onScroll = () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
    }

    // Header underline: sits under the section in view, follows the cursor on
    // hover (snapping to the nearest link), and holds on a clicked link until
    // the smooth scroll settles so it never flickers through other sections.
    function initSectionIndicator() {
        const nav = document.querySelector('.hd-nav');
        const indicator = nav && nav.querySelector('.hd-indicator');
        if (!indicator) return;
        const links = Array.from(nav.querySelectorAll('a[data-section]'))
            .map(a => ({ a, section: document.getElementById(a.dataset.section) }));
        if (!links.length) return;
        const tracked = links.filter(l => l.section);

        const state = { current: null, hover: null, pull: 0, lock: null, focus: null };
        let lockTimer = null;

        // Smoothly chase the target with frame-rate independent easing, so
        // retargeting mid-move (hover, scroll) never restarts or stutters.
        const pos = { x: 0, w: 0, tx: 0, tw: 0, shown: false };
        const TAU = 0.14; // seconds; higher = slower glide
        let rafId = null, last = 0;

        const paint = () => {
            indicator.style.transform = `translate3d(${pos.x}px,0,0) scaleX(${pos.w})`;
        };
        const step = (now) => {
            const dt = Math.min(0.064, (now - last) / 1000 || 0.016);
            last = now;
            const k = 1 - Math.exp(-dt / TAU);
            pos.x += (pos.tx - pos.x) * k;
            pos.w += (pos.tw - pos.w) * k;
            if (Math.abs(pos.tx - pos.x) < 0.1 && Math.abs(pos.tw - pos.w) < 0.1) {
                pos.x = pos.tx; pos.w = pos.tw;
                paint();
                rafId = null;
                return;
            }
            paint();
            rafId = requestAnimationFrame(step);
        };

        const render = () => {
            const link = state.hover || state.lock || state.focus || (state.current && state.current.a);
            if (!link || !link.offsetWidth) {
                nav.classList.remove('has-indicator');
                pos.shown = false;
                return;
            }
            pos.tx = link.offsetLeft + (state.hover ? state.pull : 0);
            pos.tw = link.offsetWidth;
            if (!pos.shown || reducedMotion) {
                // First appearance: place directly, then fade in
                pos.x = pos.tx; pos.w = pos.tw;
                pos.shown = true;
                paint();
            } else if (!rafId) {
                last = performance.now();
                rafId = requestAnimationFrame(step);
            }
            nav.classList.add('has-indicator');
        };

        const setCurrent = (entry) => {
            if (entry === state.current) return;
            state.current = entry;
            links.forEach(l => {
                if (l === entry) l.a.setAttribute('aria-current', 'location');
                else l.a.removeAttribute('aria-current');
            });
        };

        const sectionInView = () => {
            const line = window.innerHeight * 0.4;
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
            let active = tracked[0];
            tracked.forEach(l => { if (l.section.getBoundingClientRect().top <= line) active = l; });
            return atBottom ? tracked[tracked.length - 1] : active;
        };

        const releaseLock = () => {
            clearTimeout(lockTimer);
            state.lock = null;
            if (tracked.length) setCurrent(sectionInView());
            render();
        };
        // Release once scrolling has been quiet for a moment
        const armRelease = (delay) => {
            clearTimeout(lockTimer);
            lockTimer = setTimeout(releaseLock, delay);
        };

        const onScroll = () => {
            if (state.lock) { armRelease(180); return; }
            if (!tracked.length) return;
            const next = sectionInView();
            if (next !== state.current) {
                setCurrent(next);
                render();
            }
        };

        // Click: hold the line on the clicked link for the whole smooth scroll
        links.forEach(l => {
            l.a.addEventListener('click', () => {
                if (!l.section) return;
                state.lock = l.a;
                setCurrent(l);
                render();
                armRelease(900); // in case no scroll happens (already there)
            });
        });

        // Hover: snap to the nearest link, nudged slightly toward the cursor
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            nav.addEventListener('mousemove', (e) => {
                const x = e.clientX - nav.getBoundingClientRect().left;
                let nearest = null, best = Infinity;
                links.forEach(l => {
                    if (!l.a.offsetWidth) return;
                    const d = Math.abs(x - (l.a.offsetLeft + l.a.offsetWidth / 2));
                    if (d < best) { best = d; nearest = l.a; }
                });
                if (!nearest) return;
                const center = nearest.offsetLeft + nearest.offsetWidth / 2;
                const pull = Math.round(Math.max(-10, Math.min(10, (x - center) * 0.12)));
                if (nearest === state.hover && pull === state.pull) return;
                state.hover = nearest;
                state.pull = pull;
                render();
            });
            nav.addEventListener('mouseleave', () => {
                state.hover = null;
                render();
            });
        }

        // Keyboard focus only (mouse clicks also focus links; ignore those)
        links.forEach(l => {
            l.a.addEventListener('focus', () => {
                if (!l.a.matches(':focus-visible')) return;
                state.focus = l.a;
                render();
            });
            l.a.addEventListener('blur', () => {
                if (state.focus !== l.a) return;
                state.focus = null;
                render();
            });
        });

        if (tracked.length) setCurrent(sectionInView());
        render();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', render);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    }

    // ================================
    // Work list: filters
    // ================================
    function initWorkFilters() {
        const buttons = document.querySelectorAll('.filters button[data-filter]');
        const items = document.querySelectorAll('.work-item');
        if (!buttons.length || !items.length) return;

        buttons.forEach(btn => {
            const key = btn.dataset.filter;
            const count = key === 'all' ? items.length
                : Array.from(items).filter(i => i.dataset.category === key).length;
            const sup = btn.querySelector('.count');
            if (sup) sup.textContent = pad(count);
        });

        const apply = (key) => {
            buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === key ? 'true' : 'false'));
            items.forEach(item => {
                const show = key === 'all' || item.dataset.category === key;
                item.classList.toggle('hidden', !show);
            });
            try { sessionStorage.setItem('workFilter', key); } catch {}
        };

        const grid = document.getElementById('gallery');
        buttons.forEach(btn => btn.addEventListener('click', () => {
            grid.classList.add('is-filtered'); // cards animate in on filter changes, not on load
            apply(btn.dataset.filter);
        }));

        let saved = 'all';
        try { saved = sessionStorage.getItem('workFilter') || 'all'; } catch {}
        if (!document.querySelector(`.filters button[data-filter="${saved}"]`)) saved = 'all';
        apply(saved);
    }

    // ================================
    // Scroll reveal
    // ================================
    // Large titles rise line by line out of a mask; a <br> marks each line
    function splitLines(el) {
        el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i)
            .map((line, i) => `<span class="line" style="--l:${i}"><span>${line.trim()}</span></span>`)
            .join('');
    }

    function initScrollReveal() {
        if (reducedMotion) return;
        document.querySelectorAll('.hero-name, .section-title, .project-hero h1').forEach(splitLines);

        const targets = document.querySelectorAll('.section-head, .work-item, .work-aside, .contact-form, .contact-lede, .project-hero, .videos-container, .detail-section, .still-item, .blog-section, .site-footer');
        // Items in a grid cascade across each row
        targets.forEach(el => {
            const cols = getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length;
            const visible = Array.from(el.parentElement.children).filter(c => c.offsetParent);
            const i = Math.max(0, visible.indexOf(el));
            if (cols > 1) el.style.setProperty('--d', `${(i % cols) * 90}ms`);
        });
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        targets.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // ================================
    // Stills viewer: click to zoom, drag to pan, scroll to zoom, Esc to close
    // ================================
    function initStillsViewer() {
        document.addEventListener('click', (e) => {
            const still = e.target.closest('.still-item img');
            if (still) openViewer(still);
        });
    }

    function openViewer(still) {
        const overlay = document.createElement('div');
        overlay.className = 'viewer';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <img alt="" draggable="false">
            <button type="button" class="viewer-close" aria-label="Close">&times;</button>
            <span class="viewer-zoom" aria-hidden="true">100%</span>
            <span class="viewer-hint" aria-hidden="true">Click to zoom · Drag to pan · Scroll to zoom · Esc to close</span>`;
        const img = overlay.querySelector('img');
        const readout = overlay.querySelector('.viewer-zoom');
        img.src = still.currentSrc || still.src;
        img.alt = still.alt;

        // Pan offsets are in screen pixels, measured from the centered position
        let scale = 1, tx = 0, ty = 0, drag = null, moved = false;

        const apply = () => {
            const maxX = img.offsetWidth * (scale - 1) / 2;
            const maxY = img.offsetHeight * (scale - 1) / 2;
            tx = Math.max(-maxX, Math.min(maxX, tx));
            ty = Math.max(-maxY, Math.min(maxY, ty));
            img.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
            readout.textContent = `${Math.round(scale * 100)}%`;
            overlay.classList.toggle('is-zoomed', scale > 1);
        };
        // Zoom keeping the point under the cursor fixed
        const zoomTo = (next, x, y) => {
            next = Math.max(1, Math.min(5, next));
            const px = x - window.innerWidth / 2, py = y - window.innerHeight / 2;
            tx = px - (px - tx) * next / scale;
            ty = py - (py - ty) * next / scale;
            scale = next;
            apply();
        };

        img.addEventListener('click', (e) => {
            if (!moved) zoomTo(scale > 1 ? 1 : 2, e.clientX, e.clientY);
        });
        img.addEventListener('pointerdown', (e) => {
            moved = false;
            if (scale <= 1) return;
            drag = { x: e.clientX, y: e.clientY, tx, ty };
            img.setPointerCapture(e.pointerId);
            overlay.classList.add('is-dragging');
        });
        img.addEventListener('pointermove', (e) => {
            if (!drag) return;
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
            tx = drag.tx + dx;
            ty = drag.ty + dy;
            apply();
        });
        const endDrag = () => { drag = null; overlay.classList.remove('is-dragging'); };
        img.addEventListener('pointerup', endDrag);
        img.addEventListener('pointercancel', endDrag);
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            zoomTo(scale * (e.deltaY > 0 ? 0.9 : 1.1), e.clientX, e.clientY);
        }, { passive: false });

        const close = () => {
            document.removeEventListener('keydown', onKey);
            lockScroll(false);
            overlay.classList.remove('is-open');
            setTimeout(() => overlay.remove(), 400);
        };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.viewer-close')) close();
        });
        document.addEventListener('keydown', onKey);

        document.body.appendChild(overlay);
        lockScroll(true);
        void overlay.offsetWidth; // commit the hidden state so the fade-in transitions
        overlay.classList.add('is-open');
        overlay.querySelector('.viewer-close').focus({ preventScroll: true });
    }

    // ================================
    // Project pages
    // ================================
    // Prev/Next wrap around in the same order as the home page
    const PROJECT_ORDER = [
        'sah', 'acyr', 'pitajungle', 'chatgpt', 'wildbbq', 'goat', 'shaghf', 'granite-reef',
        'rei', 'nami', 'asu', 'blog-06-29-25'
    ];

    function initProjectNav() {
        const top = document.getElementById('nav-top');
        const bottom = document.getElementById('nav-bottom');
        if (!top && !bottom) return;

        const i = PROJECT_ORDER.indexOf(location.pathname.split('/').pop().replace(/\.html?$/, ''));
        const n = PROJECT_ORDER.length;
        const prev = i === -1 ? '../' : PROJECT_ORDER[(i - 1 + n) % n];
        const next = i === -1 ? '../' : PROJECT_ORDER[(i + 1) % n];

        const build = (cls) => `<nav class="${cls}" aria-label="Project navigation">
            <a href="${prev}" class="back-link"><span class="pn-label">Previous</span><span class="pn-arrow" aria-hidden="true">&larr;</span></a>
            <a href="../#work" class="index-link"><span class="pn-label">Index</span></a>
            <a href="${next}" class="next-link"><span class="pn-label">Next</span><span class="pn-arrow" aria-hidden="true">&rarr;</span></a>
        </nav>`;
        if (top) top.outerHTML = build('project-nav-top');
        if (bottom) bottom.outerHTML = build('project-nav');
    }

    // Number the detail blocks on project pages (Swiss index labels)
    function numberDetailSections() {
        document.querySelectorAll('.project-details').forEach(group => {
            group.querySelectorAll('.detail-section > h3').forEach((h, i) => {
                const idx = document.createElement('span');
                idx.className = 'idx';
                idx.textContent = pad(i + 1);
                h.prepend(idx);
            });
        });
    }

    // Append .html to extensionless internal links when running locally (Live Server)
    function initLocalDevLinkFix() {
        const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || location.protocol === 'file:';
        if (!isLocal) return;
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            // Skip absolute URLs, hashes/queries, directories and links that already have an extension
            if (!href || /^[a-z]+:|[#?]|\/$|^\.\.?$|\.\w+$/i.test(href)) return;
            a.setAttribute('href', href + '.html');
        });
    }

    // ================================
    // Init
    // ================================
    document.addEventListener('DOMContentLoaded', () => {
        initSmoothScroll();
        initHeroMotion();
        initHeaderState();
        initSectionIndicator();
        initHeroReel();
        initLocalClock();
        initWorkFilters();
        initProjectNav();
        numberDetailSections();
        initStillsViewer();
        initScrollReveal();
        initLocalDevLinkFix();
    });

})();
