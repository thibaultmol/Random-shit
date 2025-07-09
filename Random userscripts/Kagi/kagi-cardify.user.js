// ==UserScript==
// @name         Kagi Card Mode
// @version      1.2
// @description  Display Kagi search results in a card view
// @author       thibaultmol
// @match        https://*.kagi.com/*
// @namespace    https://github.com/thibaultmol
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/kagi-cardify.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Kagi/kagi-cardify.user.js
// @note         For Tampermonkey users: Please disable the "Check @connect" setting in Tampermonkey settings for this script to work properly
// ==/UserScript==

(function() {
  // --- Card Mode Logic ---
  let cardModeActive = false;
  let autoModeEnabled = true;
  let cleanupFns = [];
  let blobUrls = []; // Track blob URLs for cleanup
  let monitorInterval = null;

  // Load saved auto mode setting
  async function loadAutoModeSetting() {
    try {
      const saved = await GM_getValue('autoModeEnabled', false);
      autoModeEnabled = saved;
      if (autoModeEnabled) {
        startMonitoring();
      }
    } catch (e) {
      autoModeEnabled = false;
    }
  }

  // Save auto mode setting
  async function saveAutoModeSetting() {
    try {
      await GM_setValue('autoModeEnabled', autoModeEnabled);
    } catch (e) {
      console.error('Failed to save auto mode setting:', e);
    }
  }

  // Check if search results are loaded
  function areSearchResultsLoaded() {
    const searchResults = document.querySelectorAll('main h3 a');
    const mainContent = document.querySelector('main ._0_main-search-results');
    return searchResults.length > 0 && mainContent;
  }

  // Monitor for search results and auto-apply card mode
  function startMonitoring() {
    if (monitorInterval) return;

    monitorInterval = setInterval(() => {
      if (autoModeEnabled && !cardModeActive && areSearchResultsLoaded()) {
        cardModeActive = true;
        enableCardMode();
      }
    }, 250); // Check every 1/4 second
  }

  function stopMonitoring() {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
  }

  function enableCardMode() {
    // --- CSS ---
    var css = `
      /* Remove max-width on app-content to allow full width */
      .app-content {
        max-width: none !important;
      }
      /* Force app-content wrapper to stack children vertically */
      #_0_app_content {
        display: flex !important;
        flex-direction: column !important;
      }
      #kg-card-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, 325px);
        //grid-auto-rows: 638px;
        gap: 16px;
        margin: 0 0 16px;
        justify-content: start;
      }
      .kg-card {
        width: 325px;
        max-height: 638px;
        box-sizing: border-box;
        box-shadow: 1px 8px 30px 0 rgba(0,0,0,.09);
        border-radius:15px;
        color: var(--search-result-content-text);
        border: 1px solid var(--color-search-input-border);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .kg-card-img {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius:15px 15px 0px 0px;
      }
      .kg-card-body {
        padding: 12px;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .kg-card-body h4 {
        margin: 0 0 8px;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        color: var(--app-text);
      }
       .kg-card-body h4 a {color: var(--app-text);}

      .kg-card-body p {
        flex: 0 0 auto;
        margin-bottom: 10px;
        font-size: 1rem;
        line-height: 1.3;
        overflow: hidden;
        position: relative;
        text-justify: auto;
        text-align: justify;
      }
      .kg-card-body {
        position: relative;
      }
      .kg-card-body::after {
        content: '';
        pointer-events: none;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3em;
        background: linear-gradient(to bottom, rgba(255,255,255,0), var(--secondary));
      }
      .kg-card-footer .__sri-translate {
        margin-right: 8px;
      }
      .kg-card-footer {
        display: flex;
        align-items: center;
        padding: 5px 8px;
        background-color: var(--color-search-input);
        font-size: 1rem;
        border-top: 1px solid var(--color-search-input-border);
        border-radius: 0px 0px 15px 15px;
        height:40px;
      }
      .kg-card-footer a {
        text-decoration: none;
      }
      .kg-card-footer .__sri_more_menu_box {
        display: flex;
        align-items: center;
        margin-left: auto;
      }
      .kg-card-footer ._0_rank-icons {
        display: inline-flex;
        align-items: center;
        margin-right: 8px;
        color: var(--app-text);
      }
      .kg-card-footer svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
        vertical-align: middle;
      }
      .kg-card-favicon {
        width: 16px;
        height: 16px;
        margin-right: 8px;
        flex-shrink: 0;
      }
      .kg-card-wikipedia .kg-card-footer {
        height: 29px !important;
        min-height: 29px !important;
        padding: 0 8px !important;
        align-items: center !important;
        overflow: hidden;
      }
      .kg-card,
      .kg-card-footer {
        overflow: visible !important;
      }
    `;
    var style = document.createElement('style');
    style.textContent = css;
    style.className = 'kagi-cardify-style';
    document.head.appendChild(style);
    cleanupFns.push(() => style.remove());

    // --- Cardify logic ---
    var main = document.querySelector('main');
    if (!main) return;
    var wrapper = document.getElementById('_0_app_content') || main.parentElement;
    var grid = document.createElement('div');
    grid.id = 'kg-card-grid';
    wrapper.insertBefore(grid, main);
    cleanupFns.push(() => grid.remove());

    var anchors = Array.from(document.querySelectorAll('main h3 a'));
    let cardNodes = [];
    anchors.forEach(function(a) {
      var title = a.textContent.trim();
      var url = a.href;
      var host = (new URL(url)).hostname.replace(/^www\./, '');
      var container = a.closest('.search-result') || a.closest('.__srgi') || a.closest('div');
      var descEl = container.querySelector('._0_DESC, .__sri-desc, .__srgi-desc');
      var snippet = descEl ? descEl.textContent.trim() : '';
      var imgEl = container.querySelector('img:not(.__domain-favicon)');
      var faviconEl = container.querySelector('img.__domain-favicon');
      if (!faviconEl) {
        var urlBox = container.nextElementSibling;
        if (urlBox && urlBox.classList && urlBox.classList.contains('__sri-url-box')) {
          faviconEl = urlBox.querySelector('img.__domain-favicon');
        }
      }
      var faviconSrc = faviconEl ? faviconEl.src : null;

      var card = document.createElement('div');
      card.className = 'kg-card';
      if (imgEl && imgEl.src) {
        var img = document.createElement('img');
        img.className = 'kg-card-img';
        img.onerror = function() { this.remove(); };
        // Use fetchImageAsBlob for direct image fetching
        fetchImageAsBlob(imgEl.src).then(blobUrl => {
          if (blobUrl) {
            img.src = blobUrl;
            blobUrls.push(blobUrl);
          } else {
            img.src = imgEl.src;
          }
        });
        card.appendChild(img);
      }
      var body = document.createElement('div');
      body.className = 'kg-card-body';
      var h4 = document.createElement('h4');
      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = title;
      h4.appendChild(link);
      var p = document.createElement('p');
      p.textContent = snippet;
      body.appendChild(h4);
      body.appendChild(p);
      card.appendChild(body);
      var footer = document.createElement('div');
      footer.className = 'kg-card-footer';
      if (faviconSrc) {
        var favF = document.createElement('img');
        favF.src = faviconSrc;
        favF.className = 'kg-card-favicon';
        footer.appendChild(favF);
      }
      var dlink = document.createElement('a');
      dlink.href = url;
      dlink.target = '_blank';
      dlink.textContent = host;
      footer.appendChild(dlink);
      var ctrlBox = container.querySelector('.__sri_more_menu_box');
      if (ctrlBox) {
        var rightBox = document.createElement('div');
        rightBox.className = '__sri_more_menu_box';
        Array.from(ctrlBox.children).forEach(function(child) {
          if (!child.classList.contains('_0_k_ui_dropdown_data_list') &&
              !child.classList.contains('k_ui_dropdown_data_list')) {
            rightBox.appendChild(child);
          }
        });
        footer.appendChild(rightBox);
      }
      card.appendChild(footer);
      grid.appendChild(card);
      cardNodes.push(card);

      // OG image
      fetchOGImage(url).then(function(ogUrl) {
        if (ogUrl) {
          var imgEl = card.querySelector('.kg-card-img');
          if (imgEl) {
            fetchImageAsBlob(ogUrl).then(blobUrl => {
              if (blobUrl) {
                imgEl.src = blobUrl;
                blobUrls.push(blobUrl);
              } else {
                imgEl.src = ogUrl;
              }
            });
          } else {
            var newImg = document.createElement('img');
            newImg.className = 'kg-card-img';
            newImg.onerror = function() { this.remove(); };
            fetchImageAsBlob(ogUrl).then(blobUrl => {
              if (blobUrl) {
                newImg.src = blobUrl;
                blobUrls.push(blobUrl);
              } else {
                newImg.src = ogUrl;
              }
            });
            card.insertBefore(newImg, card.firstChild);
          }
        }
      });
      // Remote snippet
      fetchPageSnippet(url, p, snippet);
    });

    // Hide original list view
    var orig = document.querySelector('main ._0_main-search-results');
    if (orig) {
      orig.style.display = 'none';
      cleanupFns.push(() => { orig.style.display = ''; });
    }
    // Move More Results button and Share URL footer beneath card grid
    var moreContainer = document.querySelector('div.footer-search-results');
    if (moreContainer) {
      wrapper.insertBefore(moreContainer, main);
      cleanupFns.push(() => { wrapper.insertBefore(moreContainer, grid.nextSibling); });
    }
    var shareContainer = document.querySelector('div._0_share_url_footer');
    if (shareContainer) {
      wrapper.insertBefore(shareContainer, main);
      cleanupFns.push(() => { wrapper.insertBefore(shareContainer, grid.nextSibling); });
    }
  }

  function disableCardMode() {
    // Revoke all blob URLs
    blobUrls.forEach(url => URL.revokeObjectURL(url));
    blobUrls = [];

    // Run all cleanup functions
    while (cleanupFns.length) {
      try { cleanupFns.pop()(); } catch(e){}
    }
    // Remove style if still present
    var style = document.querySelector('.kagi-cardify-style');
    if (style) style.remove();
    // Remove card grid if still present
    var grid = document.getElementById('kg-card-grid');
    if (grid) grid.remove();
  }

  function enableAutoMode() {
    autoModeEnabled = true;
    saveAutoModeSetting();
    startMonitoring();

    // If search results are already loaded, apply card mode immediately
    if (areSearchResultsLoaded() && !cardModeActive) {
      cardModeActive = true;
      enableCardMode();
    }
  }

  function disableAutoMode() {
    autoModeEnabled = false;
    saveAutoModeSetting();
    stopMonitoring();

    // Disable current card mode if active
    if (cardModeActive) {
      cardModeActive = false;
      disableCardMode();
    }
  }

  // Register menu commands
  if (typeof GM !== "undefined" && typeof GM.registerMenuCommand === "function") {
    GM.registerMenuCommand('Enable Kagi Card Mode', enableAutoMode);
    GM.registerMenuCommand('Disable Kagi Card Mode', disableAutoMode);
  }

  // Initialize on page load
  loadAutoModeSetting();

  // --- Helper functions - MODIFIED to use blobs ---
  async function fetchOGImage(pageUrl) {
    return new Promise((resolve, reject) => {
      const gmXHR = GM.xmlHttpRequest || GM_xmlhttpRequest;
      if (!gmXHR) {
        resolve(null);
        return;
      }

      gmXHR({
        method: 'GET',
        url: pageUrl,
        timeout: 10000,
        onload: function(response) {
          if (response.status >= 200 && response.status < 300) {
            var m = response.responseText.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
            resolve(m ? m[1] : null);
          } else {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null)
      });
    });
  }

  async function fetchPageSnippet(pageUrl, pEl, original) {
    const gmXHR = GM.xmlHttpRequest || GM_xmlhttpRequest;
    if (!gmXHR) return;

    gmXHR({
      method: 'GET',
      url: pageUrl,
      timeout: 10000,
      onload: function(response) {
        if (response.status >= 200 && response.status < 300) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(response.responseText, 'text/html');
          var selectors = ['article', 'main', '[role="main"]', '.content', '#content'];
          var content = null;
          for (var sel of selectors) {
            content = doc.querySelector(sel);
            if (content) break;
          }
          var area = content || doc.body;
          var paras = area.querySelectorAll('p');
          var results = [];
          for (var para of paras) {
            var txt = para.textContent.trim();
            if (txt.length > 50 && txt.split(' ').length > 8) {
              results.push(txt);
              if (results.length >= 3) break;
            }
          }
          if (results.length > 0) {
            var parent = pEl.parentElement;
            parent.removeChild(pEl);
            results.forEach(function(text) {
              var np = document.createElement('p');
              np.textContent = text;
              parent.appendChild(np);
            });
          }
        }
      },
      onerror: function() {},
      ontimeout: function() {}
    });
  }

  // Helper: fetch image directly and convert to blob URL
  function fetchImageAsBlob(url) {
    return new Promise((resolve) => {
      const gmXHR = GM.xmlHttpRequest || GM_xmlhttpRequest;
      if (!gmXHR) return resolve(null);

      gmXHR({
        method: 'GET',
        url: url,
        responseType: 'blob',
        timeout: 10000,
        onload: function(response) {
          if (response.status >= 200 && response.status < 300 && response.response) {
            const blobUrl = URL.createObjectURL(response.response);
            resolve(blobUrl);
          } else {
            resolve(null);
          }
        },
        onerror: function() { resolve(null); },
        ontimeout: function() { resolve(null); }
      });
    });
  }

})();
