// ==UserScript==
// @name         Kagi Image Transparancy viewer
// @version      1.1
// @description  Displays actual images instead of proxies in Kagi image search when color=transparent is in URL
// @author       Thibaultmol
// @match        https://*.kagi.com/images*
// @namespace    https://github.com/thibaultmol
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/image-transparancy-viewer.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/image-transparancy-viewer.user.js
// ==/UserScript==

(function() {
    'use strict';

    let isActive = false;

    // Function to check if we should be active
    function checkIfShouldBeActive() {
        const shouldBeActive = window.location.href.includes('&color=transparent');

        // If state changed, log it
        if (shouldBeActive !== isActive) {
            isActive = shouldBeActive;
            console.log(`Direct image viewer ${isActive ? 'activated' : 'deactivated'}`);

            // If activated, immediately replace images
            if (isActive) {
                replaceWithDirectImages();
            }
        }
    }

    // Function to replace proxy images with direct images
    function replaceWithDirectImages() {
        if (!isActive) return;

        const imgLinks = document.querySelectorAll('a._0_img_link_el');

        imgLinks.forEach(link => {
            const img = link.querySelector('img._0_img_src');
            if (img && link.href && img.src !== link.href) {
                // Store original dimensions
                const width = img.width;
                const height = img.height;

                // Replace with direct image
                img.src = link.href;

                // Maintain dimensions
                img.width = width;
                img.height = height;
            }
        });
    }

    // Initial check
    checkIfShouldBeActive();

    // Monitor URL changes (for SPA navigation)
    let lastUrl = window.location.href;

    // Check for URL changes every 500ms
    setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            checkIfShouldBeActive();
        }
    }, 500);

    // Also observe for new images that might be loaded dynamically
    const observer = new MutationObserver((mutations) => {
        // First check if URL changed (for more immediate response)
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            checkIfShouldBeActive();
        }

        // Then check for new images
        if (isActive) {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    replaceWithDirectImages();
                    break;
                }
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
