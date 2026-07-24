(function () {
  'use strict';

  /* ── 1. Lazy-load all images missing the attribute ──────────── */
  function lazyLoadImages() {
    var imgs = Array.from(document.querySelectorAll('img:not([loading])'));
    if (!imgs.length) return;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
            img.setAttribute('loading', 'lazy');
            io.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      imgs.forEach(function (img) {
        // Skip above-the-fold images (LCP candidate)
        var rect = img.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.8) {
          img.setAttribute('loading', 'lazy');
          io.observe(img);
        }
      });
    } else {
      // Fallback for older browsers
      imgs.forEach(function (img) { img.setAttribute('loading', 'lazy'); });
    }
  }

  /* ── 2. Resource hints for known domains ────────────────────── */
  var PRECONNECT_DOMAINS = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://cdn.upstart.com',
    'https://www.sofi.com',
    'https://www.lightstream.com',
    'https://www.avant.com',
    'https://www.marcus.com',
    'https://www.ally.com',
    'https://www.discover.com',
    'https://www.lendingclub.com',
    'https://www.prosper.com',
    'https://www.bestegg.com',
    'https://www.rocketmortgage.com',
  ];

  function injectResourceHints() {
    var existing = Array.from(document.querySelectorAll('link[rel="preconnect"], link[rel="dns-prefetch"]'))
      .map(function (l) { return l.href; });

    PRECONNECT_DOMAINS.forEach(function (domain) {
      if (existing.indexOf(domain) !== -1) return;
      var link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /* ── 3. Prefetch apply URL on hover ─────────────────────────── */
  function initPrefetchOnHover() {
    var prefetched = {};

    document.addEventListener('mouseover', function (e) {
      var link = e.target.closest('.apply-btn, .cc-apply-btn, a[rel*="sponsored"]');
      if (!link || !link.href) return;
      var url = link.href;
      if (prefetched[url]) return;
      prefetched[url] = true;

      var prefetch = document.createElement('link');
      prefetch.rel = 'prefetch';
      prefetch.href = url;
      document.head.appendChild(prefetch);
    }, { passive: true });
  }

  /* ── 4. Font-display: swap for all @font-face ───────────────── */
  function fixFontDisplay() {
    try {
      Array.from(document.styleSheets).forEach(function (sheet) {
        try {
          Array.from(sheet.cssRules || []).forEach(function (rule) {
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              if (!rule.style.getPropertyValue('font-display')) {
                rule.style.setProperty('font-display', 'swap');
              }
            }
          });
        } catch (e) {} // Cross-origin stylesheets will throw
      });
    } catch (e) {}
  }

  /* ── 5. CLS prevention: reserve space for dynamic blocks ────── */
  function preventCLS() {
    // Reserve space for wiq-view-counter before it loads
    var h1 = document.querySelector('h1');
    if (h1 && !document.querySelector('.wiq-view-counter')) {
      var spacer = document.createElement('div');
      spacer.style.cssText = 'height:28px;width:200px;background:transparent;';
      spacer.setAttribute('aria-hidden', 'true');
      spacer.id = 'wiq-vc-spacer';
      h1.parentNode.insertBefore(spacer, h1.nextSibling);

      // Remove spacer once the real counter loads
      var observer = new MutationObserver(function () {
        if (document.querySelector('.wiq-view-counter')) {
          spacer.parentNode && spacer.parentNode.removeChild(spacer);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  /* ── 6. Web Vitals measurement → localStorage ───────────────── */
  function measureWebVitals() {
    try {
      // LCP
      if ('PerformanceObserver' in window) {
        var lcpObserver = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          var last = entries[entries.length - 1];
          if (last) {
            try { localStorage.setItem('wiq_lcp', Math.round(last.startTime)); } catch(e) {}
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // CLS
        var clsValue = 0;
        var clsObserver = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {
            if (!entry.hadRecentInput) clsValue += entry.value;
          });
          try { localStorage.setItem('wiq_cls', clsValue.toFixed(4)); } catch(e) {}
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // FID / INP
        var inpObserver = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {
            if (entry.processingStart) {
              var delay = Math.round(entry.processingStart - entry.startTime);
              try { localStorage.setItem('wiq_inp', delay); } catch(e) {}
            }
          });
        });
        try { inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 }); } catch(e) {}
      }

      // TTFB
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        try { localStorage.setItem('wiq_ttfb', Math.round(nav.responseStart - nav.requestStart)); } catch(e) {}
      }
    } catch (e) {}
  }

  /* ── 7. Passive scroll listeners audit ─────────────────────── */
  // Override addEventListener to force passive:true for scroll/touch
  // This prevents INP degradation from blocking listeners
  (function () {
    var origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
      if (['scroll', 'touchstart', 'touchmove', 'wheel'].indexOf(type) !== -1) {
        if (typeof opts === 'boolean') { opts = { capture: opts, passive: true }; }
        else if (!opts || typeof opts !== 'object') { opts = { passive: true }; }
        else if (opts.passive === undefined) { opts = Object.assign({}, opts, { passive: true }); }
      }
      return origAdd.call(this, type, fn, opts);
    };
  })();

  /* ── 8. Defer non-critical inline scripts ───────────────────── */
  function deferNonCriticalScripts() {
    // Mark all non-critical script tags for deferred execution
    // (This runs after DOMContentLoaded so it's informational only —
    //  future page loads will benefit from the preload hints we inject)
    var criticalPatterns = ['gtag', 'analytics', 'wiq-'];
    var scripts = Array.from(document.querySelectorAll('script[src]'));
    scripts.forEach(function (script) {
      var src = script.src || '';
      var isCritical = criticalPatterns.some(function (p) { return src.indexOf(p) !== -1; });
      if (!isCritical && !script.defer && !script.async) {
        // Can't retroactively defer loaded scripts, but we can preload for next visit
        var preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'script';
        preload.href = src;
        document.head.appendChild(preload);
      }
    });
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    lazyLoadImages();
    injectResourceHints();
    initPrefetchOnHover();
    fixFontDisplay();
    preventCLS();
    measureWebVitals();
    deferNonCriticalScripts();
  }

  // Run as early as possible for CLS prevention
  preventCLS();
  injectResourceHints();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
