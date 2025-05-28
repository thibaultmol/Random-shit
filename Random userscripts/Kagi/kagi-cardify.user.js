// ==UserScript==
// @name         Kagi Card Mode
// @version      1.0
// @description  Toggle Kagi search results between list and card view
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
// @connect      yunohost.thibaultmol.link
// ==/UserScript==

/**
 * THIS IS ULTRA WORK IN PROGRESS AND JUST A PROOF OF CONEPT. 
 * YOU NEED TO SET THE PROXY URL FIRST
 */
(function() {
  // --- Configurable Proxy URL ---
  const DEFAULT_PROXY_URL = 'https://yunohost.thibaultmol.link/proxy/?url=';
  async function getProxyUrl() {
    return (await (typeof GM_getValue === 'function' ? GM_getValue('proxyUrl', DEFAULT_PROXY_URL) : DEFAULT_PROXY_URL));
  }
  async function setProxyUrl() {
    const current = await getProxyUrl();
    const url = prompt('Enter CORS proxy URL:', current);
    if (url && typeof GM_setValue === 'function') {
      GM_setValue('proxyUrl', url);
      alert('Proxy URL set. Reload the page to apply.');
    }
  }

  // --- Card Mode Logic ---
  let cardModeActive = false;
  let cleanupFns = [];

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
        grid-auto-rows: 638px;
        gap: 16px;
        margin: 0 0 16px;
        justify-content: start;
      }
      .kg-card {
        width: 325px;
        height: 638px;
        box-sizing: border-box;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .kg-card-img {
        width: 100%;
        height: 160px;
        object-fit: cover;
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
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
      }
      .kg-card-body p {
        flex: 0 0 auto;
        margin: 0;
        font-size: 0.95rem;
        color: #333;
        line-height: 1.3;
        overflow: hidden;
        position: relative;
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
        background: linear-gradient(to bottom, rgba(255,255,255,0), #fff);
      }
      .kg-card-footer .__sri-translate {
        margin-right: 8px;
        color: #333;
      }
      .kg-card-footer {
        display: flex;
        align-items: center;
        padding: 5px 8px;
        background: #fff8e1;
        font-size: 0.9rem;
        border-top: 1px solid #f0e2a8;
      }
      .kg-card-footer a {
        text-decoration: none;
        color: #333;
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
        color: #333;
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
        // Use proxyImageToDataUrl for CSP-safe images
        getProxyUrl().then(proxyUrl => {
          proxyImageToDataUrl(imgEl.src, proxyUrl).then(dataUrl => {
            img.src = dataUrl || imgEl.src;
          });
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
            getProxyUrl().then(proxyUrl => {
              proxyImageToDataUrl(ogUrl, proxyUrl).then(dataUrl => {
                imgEl.src = dataUrl || ogUrl;
              });
            });
          } else {
            var newImg = document.createElement('img');
            newImg.className = 'kg-card-img';
            newImg.onerror = function() { this.remove(); };
            getProxyUrl().then(proxyUrl => {
              proxyImageToDataUrl(ogUrl, proxyUrl).then(dataUrl => {
                newImg.src = dataUrl || ogUrl;
              });
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

  function run() {
    if (!cardModeActive) {
      cardModeActive = true;
      enableCardMode();
    }
  }

  function undo() {
    if (cardModeActive) {
      cardModeActive = false;
      disableCardMode();
    }
  }

  // Register menu commands
  if (typeof GM !== "undefined" && typeof GM.registerMenuCommand === "function") {
    GM.registerMenuCommand('Enable Kagi Card Mode', run);
    GM.registerMenuCommand('Disable Kagi Card Mode', undo);
    GM.registerMenuCommand('Set Proxy URL', setProxyUrl);
  }

  // --- Helper functions - MODIFIED to use user proxy URL ---
  function proxyImageUrl(url, proxyBase) {
    proxyBase = proxyBase || DEFAULT_PROXY_URL;
    return proxyBase + encodeURIComponent(url);
  }

  async function fetchOGImage(pageUrl) {
    const proxyBase = await getProxyUrl();
    var target = proxyBase + encodeURIComponent(pageUrl);

    return new Promise((resolve, reject) => {
      const gmXHR = GM.xmlHttpRequest || GM_xmlhttpRequest;
      if (!gmXHR) {
        resolve(null);
        return;
      }

      gmXHR({
        method: 'GET',
        url: target,
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
    const proxyBase = await getProxyUrl();
    var target = proxyBase + encodeURIComponent(pageUrl);

    const gmXHR = GM.xmlHttpRequest || GM_xmlhttpRequest;
    if (!gmXHR) return;

    gmXHR({
      method: 'GET',
      url: target,
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

  // Helper: fetch image via proxy and convert to data URL for CSP-safe embedding
  function proxyImageToDataUrl(url, proxyBase) {
    proxyBase = proxyBase || DEFAULT_PROXY_URL;
    return new Promise((resolve) => {
      const gmXHR = GM.xmlHttpRequest || GM_xmlhttpRequest;
      if (!gmXHR) return resolve(null);
      var target = proxyBase + encodeURIComponent(url);
      gmXHR({
        method: 'GET',
        url: target,
        responseType: 'arraybuffer',
        timeout: 10000,
        onload: function(response) {
          if (response.status >= 200 && response.status < 300 && response.response) {
            var arr = new Uint8Array(response.response);
            var binary = '';
            for (var i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
            var base64 = btoa(binary);
            // Try to guess mime type from url extension
            var ext = (url.split('.').pop() || '').toLowerCase();
            var mime = 'image/jpeg';
            if (ext === 'png') mime = 'image/png';
            else if (ext === 'gif') mime = 'image/gif';
            else if (ext === 'webp') mime = 'image/webp';
            else if (ext === 'svg') mime = 'image/svg+xml';
            resolve(`data:${mime};base64,${base64}`);
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
