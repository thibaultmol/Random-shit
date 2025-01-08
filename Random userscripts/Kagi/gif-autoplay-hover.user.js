// ==UserScript==
// @name         Kagi Image Search GIF Animator
// @version      2.0
// @description  Controls GIF animation behavior in Kagi image search with multiple modes
// @author       thibaultmol
// @match        https://*.kagi.com/images*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @namespace    https://github.com/thibaultmol
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/gif-autoplay-hover.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/gif-autoplay-hover.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Animation modes
    const ANIMATION_MODES = {
        HOVER_ONLY_SAVER: 'hover_only_saver',
        HOVER_ONLY: 'hover_only',
        ALL_GIF_SEARCH: 'all_gif_search',
        ALWAYS_ANIMATE: 'always_animate'
    };

    const MODE_LABELS = {
        [ANIMATION_MODES.HOVER_ONLY_SAVER]: 'Animate GIFs on hover (bandwidth saver)',
        [ANIMATION_MODES.HOVER_ONLY]: 'Animate GIFs on hover (preload)',
        [ANIMATION_MODES.ALL_GIF_SEARCH]: 'Only play GIFs when doing GIF search',
        [ANIMATION_MODES.ALWAYS_ANIMATE]: 'Always animate all GIFs'
    };

    // Initialize settings
    const currentMode = GM_getValue('animationMode', ANIMATION_MODES.HOVER_ONLY_SAVER);

    // Register configuration menu commands
    function createConfigMenu() {
        for (const [mode, label] of Object.entries(MODE_LABELS)) {
            GM_registerMenuCommand(
                `${currentMode === mode ? '✓' : '❌'} ${label}`,
                () => {
                    GM_setValue('animationMode', mode);
                    location.reload();
                }
            );
        }
    }

    function isGifUrl(url) {
        return url.toLowerCase().includes('.gif');
    }

    function isGifSearch() {
        return window.location.href.includes('animatedGifHttps');
    }

    // Intersection Observer for lazy loading
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const link = entry.target;
                const img = link.querySelector('img._0_img_src');
                if (img && img.dataset.animatedUrl) {
                    img.src = img.dataset.animatedUrl;
                }
                observer.unobserve(link);
            }
        });
    }, observerOptions);

    function setupGifBehavior(link) {
        const img = link.querySelector('img._0_img_src');
        if (!img || !link.href || !isGifUrl(link.href)) return;

        const staticUrl = img.src;
        const animatedUrl = link.href;
        const width = img.width;
        const height = img.height;

        img.dataset.staticUrl = staticUrl;
        img.dataset.animatedUrl = animatedUrl;
        img.dataset.width = width;
        img.dataset.height = height;

        switch (currentMode) {
            case ANIMATION_MODES.ALWAYS_ANIMATE:
                imageObserver.observe(link);
                break;

            case ANIMATION_MODES.ALL_GIF_SEARCH:
                if (isGifSearch()) {
                    imageObserver.observe(link);
                }
                break;

            case ANIMATION_MODES.HOVER_ONLY:
                // Preload visible GIFs
                if (isElementInViewport(link)) {
                    const preloadImg = new Image();
                    preloadImg.src = animatedUrl;
                }
                link.addEventListener('mouseenter', () => {
                    img.src = animatedUrl;
                });
                link.addEventListener('mouseleave', () => {
                    img.src = staticUrl;
                });
                break;

            case ANIMATION_MODES.HOVER_ONLY_SAVER:
                // No preloading at all
                link.addEventListener('mouseenter', () => {
                    img.src = animatedUrl;
                });
                link.addEventListener('mouseleave', () => {
                    img.src = staticUrl;
                });
                break;
        }

        img.width = width;
        img.height = height;
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= -50 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function initializeGifBehavior() {
        const imgLinks = document.querySelectorAll('a._0_img_link_el');
        imgLinks.forEach(setupGifBehavior);
    }

    // Initial setup
    createConfigMenu();
    initializeGifBehavior();

    // Create observer for dynamically loaded content
    const contentObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                initializeGifBehavior();
            }
        }
    });

    // Start observing
    contentObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
