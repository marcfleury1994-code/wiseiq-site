/* WiseIQ page extras: reading progress, back-to-top, auto table of contents.
   Fully defensive — every feature no-ops on failure, page never depends on this file. */
(function () {
  'use strict';
  function safe(fn) { try { fn(); } catch (e) { /* never break the page */ } }

  document.addEventListener('DOMContentLoaded', function () {

    // Reading progress bar (long pages only)
    safe(function () {
      if (document.body.scrollHeight < window.innerHeight * 2) return;
      var bar = document.createElement('div');
      bar.className = 'wiq-progress';
      document.body.appendChild(bar);
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var max = document.body.scrollHeight - window.innerHeight;
          bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
          ticking = false;
        });
      }, { passive: true });
    });

    // Back to top
    safe(function () {
      if (document.body.scrollHeight < window.innerHeight * 2.5) return;
      var btn = document.createElement('button');
      btn.className = 'wiq-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML = '↑';
      btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      document.body.appendChild(btn);
      window.addEventListener('scroll', function () {
        btn.classList.toggle('show', window.scrollY > window.innerHeight * 1.2);
      }, { passive: true });
    });

    // Auto "On this page" TOC for long articles
    safe(function () {
      var body = document.querySelector('.article-body');
      if (!body || body.querySelector('.wiq-toc')) return;
      var hs = Array.prototype.slice.call(body.querySelectorAll('h2')).filter(function (h) {
        return h.textContent.trim().length > 2;
      });
      if (hs.length < 4) return;
      var toc = document.createElement('nav');
      toc.className = 'wiq-toc';
      var html = '<div class="t-title">On this page</div>';
      hs.forEach(function (h, i) {
        if (!h.id) h.id = 'sec-' + i + '-' + h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
        html += '<a href="#' + h.id + '">' + h.textContent.trim() + '</a>';
      });
      toc.innerHTML = html;
      var first = body.querySelector('p');
      if (first && first.parentNode) first.parentNode.insertBefore(toc, first.nextSibling);
    });

  });
})();

/* Sticky partner bar — loan-topic pages only, dismissible, session-remembered */
(function () {
  'use strict';
  try {
    var slug = location.pathname.replace(/^\/pages\//, '').replace(/\.html$/, '');
    if (!/loan|debt|borrow|emergency|consolidat|upstart/.test(slug)) return;
    if (document.querySelector('.sticky-cat-cta') || document.querySelector('.wiq-sticky')) return;
    if (sessionStorage.getItem('wiqStickyDismissed')) return;
    document.addEventListener('DOMContentLoaded', function () {
      // Personalize with the visitor's own explorer estimate when available
      var est = null;
      try {
        var s = JSON.parse(localStorage.getItem('wiqRx') || 'null');
        // use only fresh estimates (14 days) with sane values
        if (s && s.pl && s.ph && s.amt && Date.now() - (s.ts || 0) < 14 * 864e5) est = s;
      } catch (e) {}
      var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
      var isConsol = /consolidat|debt-relief|credit-card-debt|payoff/.test(slug);
      var title, sub;
      if (est) {
        title = 'Your estimate: ' + fmt(est.pl) + '–' + fmt(est.ph) + '/mo on ' + fmt(est.amt) + ' — get your real number';
        sub = 'Based on the sliders you set · Upstart, soft pull · paid partner link';
      } else if (isConsol) {
        title = 'One payment instead of five — see your real consolidation rate';
        sub = 'Upstart · soft pull, ~2 minutes · paid partner link';
      } else {
        title = 'See your real rate — soft pull, ~2 minutes';
        sub = 'Upstart · no minimum score · paid partner link';
      }
      var bar = document.createElement('div');
      bar.className = 'wiq-sticky';
      bar.innerHTML = '<div class="wiq-sticky-in">' +
        '<div class="wiq-sticky-txt"><strong></strong>' +
        '<span></span></div>' +
        '<a class="ws-cta" href="https://upstart.9c65.net/9VW6GY" rel="sponsored noopener" target="_blank">Check My Rate →</a>' +
        '<button class="ws-x" aria-label="Dismiss">×</button></div>';
      bar.querySelector('strong').textContent = title;
      bar.querySelector('.wiq-sticky-txt span').textContent = sub;
      document.body.appendChild(bar);
      bar.querySelector('.ws-x').addEventListener('click', function () {
        bar.classList.remove('show');
        try { sessionStorage.setItem('wiqStickyDismissed', '1'); } catch (e) {}
      });
      var shown = false;
      // returning visitors with an estimate see it sooner (20% scroll vs 35%)
      var threshold = est ? 0.2 : 0.35;
      window.addEventListener('scroll', function () {
        if (shown) return;
        var max = document.body.scrollHeight - window.innerHeight;
        if (max > 0 && window.scrollY / max > threshold) { shown = true; bar.classList.add('show'); }
      }, { passive: true });
    });
  } catch (e) {}
})();
