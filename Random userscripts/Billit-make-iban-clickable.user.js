// ==UserScript==
// @name         Billit make iban mention clickable
// @version      1.0
// @description  Makes the iban mention in the Snelle Invoer a link that goes to those transactions
// @author       Thibaultmol
// @match        https://my.breex.be/*
// @match        https://my.billit.be/*
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Billit-make-iban-clickable.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Billit-make-iban-clickable.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // European country codes for IBAN
    const EUROPEAN_COUNTRY_CODES = [
        'AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE',
        'ES', 'FI', 'FR', 'GB', 'GI', 'GR', 'HR', 'HU', 'IE', 'IS',
        'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO', 'PL',
        'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA'
    ];

    // Function to get current domain
    function getCurrentDomain() {
        return window.location.hostname;
    }

    // Function to convert IBAN with spaces to format needed for URL
    function formatIBANForUrl(iban) {
        return iban.replace(/\s+/g, '');
    }

    // Function to check if string matches IBAN pattern
    function isIBAN(text) {
        const cleanText = text.trim().replace(/\s+/g, '');
        // Check if starts with any valid country code followed by 2 digits
        const countryCodePattern = EUROPEAN_COUNTRY_CODES.join('|');
        const ibanRegex = new RegExp(`^(${countryCodePattern})\\d{2}[\\dA-Z]+$`);
        return ibanRegex.test(cleanText);
    }

    // Function to convert span to link
    function convertSpanToLink() {
        const spans = document.querySelectorAll('span.form-control-plaintext');
        const currentDomain = getCurrentDomain();

        spans.forEach(span => {
            const text = span.textContent.trim();

            if (isIBAN(text)) {
                const formattedIBAN = formatIBANForUrl(text);
                const link = document.createElement('a');
                link.href = `https://${currentDomain}/Payment/Index?Search=${formattedIBAN}`;
                link.textContent = text;
                link.className = 'form-control-plaintext';
                link.style.textDecoration = 'underline';

                span.parentNode.replaceChild(link, span);
            }
        });
    }

    // Initial conversion
    convertSpanToLink();

    // Monitor for dynamic content changes
    const observer = new MutationObserver((mutations) => {
        convertSpanToLink();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();