// ==UserScript==
// @name         Kagi Quick Access Icons
// @version      1.0
// @description  Adds configurable quick access icons to Kagi
// @author       thibaultmol
// @match        https://*.kagi.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @namespace    https://github.com/thibaultmol
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/quick-access.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/quick-access.user.js
// ==/UserScript==


(function() {
    'use strict';

    // Default configuration
    const defaultConfig = {
        assistant: true,
        translate: false,
        smallweb: false,
        summarizer: false,
        fastgpt: false
    };

    // Icon definitions (I DO NOT OWN THESE LOGO'S, THEY ARE PROPERTY OF KAGI)
    const icons = {
        assistant: {
            svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="white" fill="none"></circle><circle class="ring-dot" cx="4.758" cy="16.467" r="2.221"></circle><circle class="ring-dot" cx="12.867" cy="4.242" r="2.221"></circle><circle class="ring-dot" cx="5.433" cy="7.867" r="2.642"></circle><circle class="ring-dot" cx="19.867" cy="11.150" r="2.642"></circle><circle class="ring-dot" cx="15.950" cy="19.392" r="2.462"></circle><circle class="center-dot" cx="12" cy="12" r="2"></circle></svg>`,
            path: '/assistant',
            title: 'Assistant'
        },
        translate: {
            svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="1.7" stroke="white" stroke-width="1.5" stroke-miterlimit="10"></rect><path d="M13.5 11H19.3A1.7 1.7 0 0121 12.3V19.3A1.7 1.7 0 0119.3 21H12.7A1.7 1.7 0 0111 19.3V13.5" stroke="white" stroke-width="1.5" stroke-miterlimit="10"></path><path d="M5.5 6.5H7.5M10 6.5H9M9 6.5C8.82586 7.19655 8.39701 8.28428 7.68491 9.2214M9 6.5H7.5M5.5 10.5C6.64621 10.309 7.03392 10.0781 7.68491 9.2214M7.68491 9.2214C8.28994 9.81427 9 10.5 10 10.5M7.5 5.5V6.5" stroke="white" stroke-width="1.5" stroke-linecap="round"></path><path d="M17.8292 18.8354C18.0144 19.2059 18.4649 19.3561 18.8354 19.1708 19.2059 18.9856 19.3561 18.5351 19.1708 18.1646L16.8497 13.5224C16.4996 12.8222 15.5004 12.8222 15.1503 13.5224L12.8292 18.1646C12.6439 18.5351 12.7941 18.9856 13.1646 19.1708 13.5351 19.3561 13.9856 19.2059 14.1708 18.8354L16.4919 14.1932 15.5081 14.1932ZM14.5 17.75H17.5V16.25H14.5V17.75Z" fill="white"></path></svg>`,
            path: '/translate',
            title: 'Translate'
        },
        smallweb: {
            svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.6 9H20.4M3.6 15H20.4M11.5 3C9.81534 5.69961 8.9222 8.81787 8.9222 12C8.9222 15.1821 9.81534 18.3004 11.5 21M12.5 3C14.1847 5.69961 15.0778 8.81787 15.0778 12C15.0778 15.1821 14.1847 18.3004 12.5 21M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15 15L12.5 21L14.5 20.5L18 18.5L20.5 15H15Z" fill="white"></path></svg>`,
            path: '/smallweb',
            title: 'Small Web'
        },
        summarizer: {
            svg: `<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 13V5a1 1 0 0 0-1-1h-8m9 14v1a1 1 0 0 1-1 1h-1m-5 0h-2m-5 0H5a1 1 0 0 1-1-1v-1m0-5v-2m0-5V5a1 1 0 0 1 1-1h1m14 8h-7a1 1 0 0 1-1-1V4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            path: '/summarizer',
            title: 'Universal Summarizer'
        },
        fastgpt: {
            svg: `<svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m12 4-4 7h6l-4 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            path: '/fastgpt',
            title: 'FastGPT'
        }
    };

    // Get user configuration
    let config = GM_getValue('kagiQuickAccessConfig', defaultConfig);

    // Create and inject CSS
    const style = document.createElement('style');
    style.textContent = `
    .quick-access-icon {
        position: relative;
        width: 40px;
        height: 40px;
        background-repeat: no-repeat;
        background-position: center;
        background-color: transparent;
        border-radius: 6px;
        display: block;
        z-index: 100;
        cursor: pointer;
    }

    .quick-access-icon:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .user-auth-bar {
        position: relative;
    }

    .quick-access-container {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        gap: 8px;
        margin-right: 16px;
    }

    /* Ensure proper positioning relative to the apps dropdown */
    .app_nav_dropdown {
        position: relative;
        margin-left: calc(40px * var(--icon-count) + 8px * (var(--icon-count - 1) + 2));
    }
`;

    document.head.appendChild(style);

    // Create and add the quick access icons
    function addQuickAccessIcons() {
        const authBar = document.querySelector('.user-auth-bar');
        if (!authBar || document.querySelector('.quick-access-container')) return;

        const container = document.createElement('div');
        container.className = 'quick-access-container';

        let enabledCount = Object.values(config).filter(Boolean).length;

        // Set the CSS variable for icon count
        document.documentElement.style.setProperty('--icon-count', enabledCount);

        for (const [key, enabled] of Object.entries(config)) {
            if (enabled && icons[key]) {
                const link = document.createElement('a');
                link.href = icons[key].path;
                link.className = 'quick-access-icon';
                link.title = icons[key].title;
                link.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(icons[key].svg)}")`;
                container.appendChild(link);
            }
        }

        authBar.insertBefore(container, authBar.firstChild);
    }


    // Configuration menu
    function createConfigMenu() {
        for (const [key, icon] of Object.entries(icons)) {
            GM_registerMenuCommand(
                `${config[key] ? '✓' : '❌'} Show ${icon.title}`,
                () => {
                    config[key] = !config[key];
                    GM_setValue('kagiQuickAccessConfig', config);
                    location.reload();
                }
            );
        }
    }

    // Initial setup
    addQuickAccessIcons();
    createConfigMenu();

    // Observer for dynamic content loading
    const observer = new MutationObserver((mutations) => {
        if (!document.querySelector('.quick-access-container')) {
            addQuickAccessIcons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();