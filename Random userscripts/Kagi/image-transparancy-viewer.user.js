// ==UserScript==
// @name         Kagi Image Transparancy viewer
// @version      1.0
// @description  Displays actual images instead of proxies in Kagi image search when color=transparent is in URL
// @author       Thibaultmol
// @match        https://*.kagi.com/images*
// @namespace    https://github.com/thibaultmol
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/image-transparancy-viewer.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/image-transparancy-viewer.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Only run if color=transparent is in the URL
    if (!window.location.href.includes('&color=transparent')) {
        return;
    }

    // Function to replace proxy images with direct images
    function replaceWithDirectImages() {
        const imgLinks = document.querySelectorAll('a._0_img_link_el');

        imgLinks.forEach(link => {
            const img = link.querySelector('img._0_img_src');
            if (img && link.href) {
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

    // Run immediately
    replaceWithDirectImages();

    // Also observe for new images that might be loaded dynamically
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                replaceWithDirectImages();
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
