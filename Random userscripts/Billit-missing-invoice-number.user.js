// ==UserScript==
// @name         Billit Missing Order Numbers Checker
// @version      1.3
// @description  Adds a button to check for missing order numbers on the Incoming invoices page
// @author       Thibaultmol
// @match        https://my.breex.be/Order/Income/Invoice/*
// @match        https://my.billit.be/Order/Income/Invoice/*
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Billit-missing-invoice-numbers.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Billit-missing-invoice-numbers.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function findMissingNumbers(numbers) {
        // Convert to integers, ignore non-numeric values, then sort ascending
        numbers = numbers
            .map(n => parseInt(n, 10))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        let missing = [];
        for(let i = 0; i < numbers.length - 1; i++) {
            let diff = numbers[i + 1] - numbers[i];
            if(diff > 1) {
                for(let j = 1; j < diff; j++) {
                    missing.push(numbers[i] + j);
                }
            }
        }
        return missing.sort((a, b) => b - a);
    }

    function checkMissingNumbers() {
        let orderNumbers = [];
        document.querySelectorAll('td[sortcolumn="OrderNumber"]').forEach(td => {
            orderNumbers.push(td.textContent.trim());
        });

        let missingNumbers = findMissingNumbers(orderNumbers);

        if(missingNumbers.length > 0) {
            alert('Missing order numbers:\n' + missingNumbers.join(', '));
        } else {
            alert('No missing order numbers found!');
        }
    }

    function addButton() {
        // Remove existing button if present
        const existingButton = document.querySelector('.check-missing-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const buttonRow = document.querySelector('.buttonRow');
        if(buttonRow) {
            const newButton = document.createElement('button');
            newButton.className = 'btn-sm btn-secondary btn hideOnPost check-missing-btn';
            newButton.type = 'button';
            newButton.innerHTML = '<i class="fas fa-search"></i><span class="ml-2">Check Missing</span>';
            newButton.addEventListener('click', checkMissingNumbers);

            newButton.style.setProperty('--bs-btn-focus-box-shadow', '0 0 0 0.2rem rgba(41, 255, 114, 0.5)');
            newButton.style.setProperty('box-shadow', '0px 0px 0px 4px inset rgba(41, 255, 114, 0.5)', 'important');

            const btnGroup = buttonRow.querySelector('.btn-group');
            buttonRow.insertBefore(newButton, btnGroup);
        }
    }

    // Initial button add
    addButton();

    // Watch for AJAX content updates
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.target.id === 'OrderList' &&
                mutation.type === 'childList' &&
                mutation.addedNodes.length > 0) {
                // Wait a brief moment for the DOM to settle
                setTimeout(addButton, 100);
                break;
            }
        }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also watch for URL changes via History API
    const originalPushState = history.pushState;
    history.pushState = function() {
        setTimeout(addButton, 100);
        return originalPushState.apply(this, arguments);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        setTimeout(addButton, 100);
        return originalReplaceState.apply(this, arguments);
    };
})();
