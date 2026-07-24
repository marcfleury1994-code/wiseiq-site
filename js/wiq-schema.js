(function () {
  'use strict';

  function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function injectSchema(obj) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(obj, null, 2);
    document.head.appendChild(script);
  }

  function hasSchema(type) {
    return qsa('script[type="application/ld+json"]').some(function (s) {
      try { var d = JSON.parse(s.textContent); return d['@type'] === type || (d['@graph'] && d['@graph'].some(function(n){ return n['@type'] === type; })); }
      catch (e) { return false; }
    });
  }

  var url  = window.location.href;
  var path = window.location.pathname.toLowerCase();
  var title = document.title || '';
  var h1Text = (qs('h1') || {}).textContent || title;
  var dateEl = qs('time[datetime], .published-date, .post-date, .last-updated-date');
  var dateStr = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent.trim()) : new Date().toISOString().split('T')[0];

  /* ── 1. WebSite schema (all pages) ─────────────────────────── */
  function injectWebSiteSchema() {
    if (hasSchema('WebSite')) return;
    injectSchema({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'WiseIQ',
      'url': window.location.origin,
      'description': 'Conflict-free financial product comparisons, calculators, and personalized recommendations.',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': { '@type': 'EntryPoint', 'urlTemplate': window.location.origin + '/search?q={search_term_string}' },
        'query-input': 'required name=search_term_string'
      }
    });
  }

  /* ── 2. BreadcrumbList schema ───────────────────────────────── */
  function injectBreadcrumbSchema() {
    if (hasSchema('BreadcrumbList')) return;
    var parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    if (!parts.length) return;

    var items = [{ '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': window.location.origin }];
    var cumPath = window.location.origin;
    parts.forEach(function (part, i) {
      cumPath += '/' + part;
      var name = part.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      // Clean up common suffixes
      name = name.replace(/\.html?$/i, '').replace(/Blog /i, '');
      items.push({ '@type': 'ListItem', 'position': i + 2, 'name': name, 'item': cumPath });
    });

    injectSchema({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items });
  }

  /* ── 3. HowTo schema for calculator and guide pages ────────── */
  function injectHowToSchema() {
    if (hasSchema('HowTo')) return;
    var isCalc = /calc|calculator/.test(path);
    var isGuide = /how-to|guide|tips|steps/.test(path);
    if (!isCalc && !isGuide) return;

    // Extract steps from ordered lists or numbered headings
    var steps = [];
    var olItems = qsa('ol > li');
    if (olItems.length >= 2) {
      olItems.slice(0, 10).forEach(function (li, i) {
        steps.push({
          '@type': 'HowToStep',
          'position': i + 1,
          'name': li.textContent.trim().substring(0, 80),
          'text': li.textContent.trim().substring(0, 300)
        });
      });
    }

    // Fallback: extract from H2/H3 headings that look like steps
    if (steps.length < 2) {
      qsa('h2, h3').forEach(function (h, i) {
        var text = h.textContent.trim();
        if (/step|how|enter|select|choose|click|apply|compare/i.test(text)) {
          var nextP = h.nextElementSibling;
          steps.push({
            '@type': 'HowToStep',
            'position': steps.length + 1,
            'name': text.substring(0, 80),
            'text': (nextP ? nextP.textContent.trim().substring(0, 300) : text)
          });
        }
      });
    }

    // Calculator-specific default steps
    if (steps.length < 2 && isCalc) {
      var calcType = /mortgage/.test(path) ? 'mortgage' : /balance.transfer/.test(path) ? 'balance transfer' : /personal.loan/.test(path) ? 'personal loan' : 'financial';
      steps = [
        { '@type': 'HowToStep', 'position': 1, 'name': 'Enter your loan details', 'text': 'Input your desired ' + calcType + ' amount and current interest rate.' },
        { '@type': 'HowToStep', 'position': 2, 'name': 'Adjust the loan term', 'text': 'Use the slider to select your preferred repayment period.' },
        { '@type': 'HowToStep', 'position': 3, 'name': 'Review your results', 'text': 'See your estimated monthly payment, total interest, and total cost instantly.' },
        { '@type': 'HowToStep', 'position': 4, 'name': 'Compare lender offers', 'text': 'Use the results to compare real lender offers and find the best rate for your situation.' },
      ];
    }

    if (steps.length < 2) return;

    injectSchema({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': h1Text.trim().substring(0, 110),
      'description': (qs('meta[name="description"]') || {}).content || h1Text.trim(),
      'totalTime': 'PT5M',
      'step': steps
    });
  }

  /* ── 4. FinancialProduct schema for comparison pages ────────── */
  function injectFinancialProductSchema() {
    var cards = qsa('.lender-card, .loan-card, .cc-card, .savings-card, .pick-card, .product-card-v2');
    if (!cards.length) return;

    var products = [];
    cards.slice(0, 5).forEach(function (card) {
      var nameEl = card.querySelector('.lender-name, .card-name, .cc-name, .product-name, h3, h4');
      if (!nameEl) return;
      var name = nameEl.textContent.trim();

      var minApr = card.getAttribute('data-min-apr') || '';
      var maxApr = card.getAttribute('data-max-apr') || '';
      var applyBtn = card.querySelector('.apply-btn, .cc-apply-btn, a[rel*="sponsored"]');
      var applyUrl = applyBtn ? (applyBtn.href || '') : '';

      var product = {
        '@type': 'FinancialProduct',
        'name': name,
        'url': applyUrl || url,
        'provider': { '@type': 'Organization', 'name': name }
      };

      if (minApr && maxApr) {
        product['annualPercentageRate'] = { '@type': 'QuantitativeValue', 'minValue': parseFloat(minApr), 'maxValue': parseFloat(maxApr), 'unitCode': 'P1' };
      }

      // Star rating from wiq-star-row if present
      var starRow = card.querySelector('.wiq-star-row');
      if (starRow) {
        var scoreEl = starRow.querySelector('.wiq-star-score');
        var countEl = starRow.querySelector('.wiq-star-count');
        if (scoreEl && countEl) {
          var ratingVal = parseFloat(scoreEl.textContent);
          var reviewCount = parseInt((countEl.textContent || '').replace(/[^0-9]/g, ''), 10);
          if (!isNaN(ratingVal) && !isNaN(reviewCount)) {
            product['aggregateRating'] = {
              '@type': 'AggregateRating',
              'ratingValue': ratingVal,
              'reviewCount': reviewCount,
              'bestRating': 5,
              'worstRating': 1
            };
          }
        }
      }

      products.push(product);
    });

    if (!products.length) return;

    // Inject each product as a separate schema block (Google prefers this)
    products.forEach(function (p) {
      // Check if this product's schema already exists
      var exists = qsa('script[type="application/ld+json"]').some(function (s) {
        try { var d = JSON.parse(s.textContent); return d['@type'] === 'FinancialProduct' && d.name === p.name; }
        catch (e) { return false; }
      });
      if (!exists) injectSchema({ '@context': 'https://schema.org', ...p });
    });
  }

  /* ── 5. Article/BlogPosting schema for blog pages ───────────── */
  function injectArticleSchema() {
    if (hasSchema('Article') || hasSchema('BlogPosting')) return;
    var isBlog = /blog|guide|article|review|tips/.test(path);
    if (!isBlog) return;

    var descEl = qs('meta[name="description"]');
    var desc = descEl ? descEl.content : h1Text.trim().substring(0, 200);

    injectSchema({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': h1Text.trim().substring(0, 110),
      'description': desc,
      'url': url,
      'datePublished': dateStr,
      'dateModified': new Date().toISOString().split('T')[0],
      'author': { '@type': 'Organization', 'name': 'WiseIQ Editorial Team', 'url': window.location.origin + '/about' },
      'publisher': {
        '@type': 'Organization',
        'name': 'WiseIQ',
        'url': window.location.origin,
        'logo': { '@type': 'ImageObject', 'url': window.location.origin + '/assets/logo.png' }
      },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': url }
    });
  }

  /* ── 6. Enhanced FAQPage schema ─────────────────────────────── */
  function upgradeOrInjectFAQSchema() {
    // Extract Q&A from page
    var qaPairs = [];

    // Pattern 1: .faq-item, .faq-q/.faq-a
    qsa('.faq-item, .faq-block, .accordion-item').forEach(function (item) {
      var q = item.querySelector('.faq-q, .faq-question, .accordion-header, summary, dt, h3, h4');
      var a = item.querySelector('.faq-a, .faq-answer, .accordion-body, .accordion-content, dd, p');
      if (q && a) {
        qaPairs.push({ q: q.textContent.trim(), a: a.textContent.trim().substring(0, 500) });
      }
    });

    // Pattern 2: details/summary elements
    qsa('details').forEach(function (det) {
      var q = det.querySelector('summary');
      var a = det.querySelector('p, div:not(summary)');
      if (q && a) {
        qaPairs.push({ q: q.textContent.trim(), a: a.textContent.trim().substring(0, 500) });
      }
    });

    if (!qaPairs.length) return;

    // Check if FAQPage schema already exists and has these questions
    var existingScript = qsa('script[type="application/ld+json"]').find(function (s) {
      try { var d = JSON.parse(s.textContent); return d['@type'] === 'FAQPage'; }
      catch (e) { return false; }
    });

    if (existingScript) {
      try {
        var existing = JSON.parse(existingScript.textContent);
        var existingQs = (existing.mainEntity || []).map(function (e) { return e.name; });
        var newPairs = qaPairs.filter(function (p) { return existingQs.indexOf(p.q) === -1; });
        if (newPairs.length) {
          newPairs.forEach(function (p) {
            existing.mainEntity.push({
              '@type': 'Question',
              'name': p.q,
              'acceptedAnswer': { '@type': 'Answer', 'text': p.a }
            });
          });
          existingScript.textContent = JSON.stringify(existing, null, 2);
        }
      } catch (e) {}
    } else {
      injectSchema({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': qaPairs.map(function (p) {
          return {
            '@type': 'Question',
            'name': p.q,
            'acceptedAnswer': { '@type': 'Answer', 'text': p.a }
          };
        })
      });
    }
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    injectWebSiteSchema();
    injectBreadcrumbSchema();
    injectHowToSchema();
    injectFinancialProductSchema();
    injectArticleSchema();
    upgradeOrInjectFAQSchema();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
