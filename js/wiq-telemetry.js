(function (window, document) {
  'use strict';

  // ── Configuration ─────────────────────────────────────────────
  var CONFIG = {
    endpoint: '/t',                    // First-party telemetry endpoint
    sessionKey: 'wiq_session_id',
    sisKey: 'wiq_sis',
    cohortKey: 'wiq_cohort',
    eventBufferKey: 'wiq_event_buffer',
    flushInterval: 10000,              // Flush every 10 seconds
    maxSIS: 100,
    sisDecayMinutes: 30,               // SIS decays if inactive
    version: '1.0'
  };

  // ── Signal Tier Weights ────────────────────────────────────────
  var WEIGHTS = {
    T1: 1,   // Arrival / contextual
    T2: 2,   // Passive engagement
    T3: 4,   // Active interest
    T4: 8,   // Calculation intent
    T5: 16   // Decision proximity
  };

  // ── SIS Score Caps per event type ─────────────────────────────
  var EVENT_SCORES = {
    // T1 — Arrival
    'page_view':              { tier: 'T1', points: 2 },
    'organic_landing':        { tier: 'T1', points: 3 },
    'return_visit':           { tier: 'T1', points: 5 },

    // T2 — Passive engagement
    'scroll_50':              { tier: 'T2', points: 3 },
    'scroll_75':              { tier: 'T2', points: 4 },
    'time_on_page_90s':       { tier: 'T2', points: 4 },
    'time_on_page_180s':      { tier: 'T2', points: 5 },
    'multi_page_session':     { tier: 'T2', points: 4 },

    // T3 — Active interest
    'filter_interaction':     { tier: 'T3', points: 5 },
    'credit_band_selected':   { tier: 'T3', points: 6 },
    'lender_card_expanded':   { tier: 'T3', points: 5 },
    'sort_changed':           { tier: 'T3', points: 4 },
    'tooltip_opened':         { tier: 'T3', points: 3 },
    'why_ranked_opened':      { tier: 'T3', points: 6 },

    // T4 — Calculation intent
    'calculator_amount_set':  { tier: 'T4', points: 8 },
    'calculator_term_set':    { tier: 'T4', points: 6 },
    'calculator_term_changed':{ tier: 'T4', points: 7 },
    'payment_viewed':         { tier: 'T4', points: 8 },
    'rate_comparison_used':   { tier: 'T4', points: 9 },

    // T5 — Decision proximity
    'cta_hover_2s':           { tier: 'T5', points: 10 },
    'cta_hover_5s':           { tier: 'T5', points: 14 },
    'sticky_bar_shown':       { tier: 'T5', points: 6 },
    'sticky_bar_tapped':      { tier: 'T5', points: 16 },
    'back_from_partner':      { tier: 'T5', points: 18 },
    'cta_clicked':            { tier: 'T5', points: 20 }
  };

  // ── Session Management ─────────────────────────────────────────
  var Session = {
    id: null,
    startTime: null,
    pageCount: 0,
    productCategories: [],
    creditBand: null,
    calculatorUsed: false,
    lenderInteractions: [],

    init: function () {
      var stored = sessionStorage.getItem(CONFIG.sessionKey);
      if (stored) {
        try {
          var data = JSON.parse(stored);
          this.id = data.id;
          this.startTime = data.startTime;
          this.pageCount = data.pageCount || 0;
          this.productCategories = data.productCategories || [];
          this.creditBand = data.creditBand || null;
          this.calculatorUsed = data.calculatorUsed || false;
          this.lenderInteractions = data.lenderInteractions || [];
        } catch (e) {
          this._create();
        }
      } else {
        this._create();
      }
      this.pageCount++;
      this._save();
    },

    _create: function () {
      this.id = 'wiq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.startTime = Date.now();
      this.pageCount = 0;
      this.productCategories = [];
      this.creditBand = null;
      this.calculatorUsed = false;
      this.lenderInteractions = [];
    },

    _save: function () {
      try {
        sessionStorage.setItem(CONFIG.sessionKey, JSON.stringify({
          id: this.id,
          startTime: this.startTime,
          pageCount: this.pageCount,
          productCategories: this.productCategories,
          creditBand: this.creditBand,
          calculatorUsed: this.calculatorUsed,
          lenderInteractions: this.lenderInteractions
        }));
      } catch (e) { /* sessionStorage full or unavailable */ }
    },

    addCategory: function (cat) {
      if (cat && this.productCategories.indexOf(cat) === -1) {
        this.productCategories.push(cat);
        this._save();
      }
    },

    setCreditBand: function (band) {
      this.creditBand = band;
      this._save();
    },

    setCalculatorUsed: function () {
      this.calculatorUsed = true;
      this._save();
    },

    addLenderInteraction: function (lender) {
      if (lender && this.lenderInteractions.indexOf(lender) === -1) {
        this.lenderInteractions.push(lender);
        this._save();
      }
    }
  };

  // ── SIS (Session Intent Score) ─────────────────────────────────
  var SIS = {
    score: 0,
    events: [],

    init: function () {
      var stored = sessionStorage.getItem(CONFIG.sisKey);
      if (stored) {
        try {
          var data = JSON.parse(stored);
          this.score = data.score || 0;
          this.events = data.events || [];
        } catch (e) {
          this.score = 0;
          this.events = [];
        }
      }
    },

    add: function (eventType) {
      var def = EVENT_SCORES[eventType];
      if (!def) return;

      // Prevent double-counting same event type in session
      if (this.events.indexOf(eventType) !== -1) {
        // Allow re-scoring for high-value events with multiplier cap
        if (def.tier !== 'T4' && def.tier !== 'T5') return;
      }

      var points = def.points * WEIGHTS[def.tier];
      this.score = Math.min(CONFIG.maxSIS, this.score + points);
      if (this.events.indexOf(eventType) === -1) {
        this.events.push(eventType);
      }
      this._save();
      this._broadcast();
    },

    _save: function () {
      try {
        sessionStorage.setItem(CONFIG.sisKey, JSON.stringify({
          score: this.score,
          events: this.events,
          updatedAt: Date.now()
        }));
      } catch (e) {}
    },

    _broadcast: function () {
      // Dispatch custom event so cohort engine can react
      try {
        var evt = new CustomEvent('wiq:sis_updated', {
          detail: { score: this.score, events: this.events }
        });
        document.dispatchEvent(evt);
      } catch (e) {}
    },

    get: function () {
      return this.score;
    }
  };

  // ── Event Bus ─────────────────────────────────────────────────
  var EventBus = {
    buffer: [],
    flushTimer: null,

    init: function () {
      // Flush on page unload
      window.addEventListener('beforeunload', function () {
        EventBus.flush(true);
      });
      window.addEventListener('pagehide', function () {
        EventBus.flush(true);
      });
      // Periodic flush
      this.flushTimer = setInterval(function () {
        EventBus.flush(false);
      }, CONFIG.flushInterval);
    },

    fire: function (eventType, payload) {
      var event = {
        s: Session.id,                          // session_id
        e: eventType,                            // event_type
        p: document.location.pathname,          // page_slug
        c: _getProductCategory(),               // product_category
        t: Date.now(),                           // timestamp_ms
        d: payload || {}                         // event data
      };

      // Update SIS
      SIS.add(eventType);

      // Buffer for batch send
      this.buffer.push(event);

      // Immediate flush for high-value events
      if (eventType === 'cta_clicked' || eventType === 'back_from_partner') {
        this.flush(true);
      }
    },

    flush: function (sync) {
      if (this.buffer.length === 0) return;
      var payload = JSON.stringify({
        session_id: Session.id,
        events: this.buffer.splice(0),
        sis: SIS.get(),
        cohort: sessionStorage.getItem(CONFIG.cohortKey),
        v: CONFIG.version
      });

      // Use sendBeacon for non-blocking, reliable delivery
      if (navigator.sendBeacon && !sync) {
        navigator.sendBeacon(CONFIG.endpoint, new Blob([payload], { type: 'application/json' }));
      } else {
        // Synchronous fallback for beforeunload
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', CONFIG.endpoint, false); // sync
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(payload);
        } catch (e) { /* fail silently */ }
      }
    }
  };

  // ── Page Context Detection ─────────────────────────────────────
  function _getProductCategory() {
    var path = document.location.pathname;
    if (/personal-loan|personal_loan/.test(path)) return 'personal-loan';
    if (/credit-card|credit_card/.test(path)) return 'credit-card';
    if (/mortgage/.test(path)) return 'mortgage';
    if (/auto-loan|auto_loan/.test(path)) return 'auto-loan';
    if (/student-loan|student_loan/.test(path)) return 'student-loan';
    if (/savings|high-yield/.test(path)) return 'savings';
    if (/debt-consolidation/.test(path)) return 'debt-consolidation';
    return 'general';
  }

  // ── Scroll Depth Tracking ──────────────────────────────────────
  function _initScrollTracking() {
    var fired50 = false, fired75 = false;
    var docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight
    );

    function onScroll() {
      var scrolled = window.scrollY + window.innerHeight;
      var pct = (scrolled / docHeight) * 100;
      if (!fired50 && pct >= 50) {
        fired50 = true;
        EventBus.fire('scroll_50', { pct: 50 });
      }
      if (!fired75 && pct >= 75) {
        fired75 = true;
        EventBus.fire('scroll_75', { pct: 75 });
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── Time on Page Tracking ──────────────────────────────────────
  function _initTimeTracking() {
    var fired90 = false, fired180 = false;
    var start = Date.now();

    var timer = setInterval(function () {
      var elapsed = (Date.now() - start) / 1000;
      if (!fired90 && elapsed >= 90) {
        fired90 = true;
        EventBus.fire('time_on_page_90s', { seconds: 90 });
      }
      if (!fired180 && elapsed >= 180) {
        fired180 = true;
        EventBus.fire('time_on_page_180s', { seconds: 180 });
        clearInterval(timer);
      }
    }, 5000);
  }

  // ── CTA Hover Tracking ─────────────────────────────────────────
  function _initCTATracking() {
    var ctaButtons = document.querySelectorAll(
      '.check-rate-btn, .cta-button, [data-cta], .wiq-sticky-cta-btn'
    );

    ctaButtons.forEach(function (btn) {
      var hoverStart = null;
      var fired2s = false, fired5s = false;

      btn.addEventListener('mouseenter', function () {
        hoverStart = Date.now();
      });

      btn.addEventListener('mouseleave', function () {
        if (!hoverStart) return;
        var duration = (Date.now() - hoverStart) / 1000;
        if (!fired2s && duration >= 2) {
          fired2s = true;
          EventBus.fire('cta_hover_2s', { duration: duration });
        }
        if (!fired5s && duration >= 5) {
          fired5s = true;
          EventBus.fire('cta_hover_5s', { duration: duration });
        }
        hoverStart = null;
      });

      btn.addEventListener('click', function () {
        var lender = btn.getAttribute('data-lender') || btn.closest('[data-lender]');
        if (lender && typeof lender === 'object') lender = lender.getAttribute('data-lender');
        EventBus.fire('cta_clicked', {
          lender: lender || 'unknown',
          page: document.location.pathname
        });
        if (lender) Session.addLenderInteraction(lender);
      });
    });
  }

  // ── Filter & Calculator Tracking ──────────────────────────────
  function _initInteractionTracking() {
    // Credit band selector
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('.wiq-score-chip, [data-credit-band]');
      if (chip) {
        var band = chip.getAttribute('data-credit-band') || chip.textContent.trim();
        EventBus.fire('credit_band_selected', { band: band });
        Session.setCreditBand(band);
        SIS.add('credit_band_selected');
      }

      // Filter bar interactions
      var filterEl = e.target.closest('.wiq-filter-bar input, .wiq-filter-bar select, .wiq-filter-bar button');
      if (filterEl) {
        EventBus.fire('filter_interaction', { type: filterEl.tagName.toLowerCase() });
      }

      // Lender card expansion
      var cardToggle = e.target.closest('[data-expand-card], .wiq-card-expand');
      if (cardToggle) {
        var lender = cardToggle.getAttribute('data-lender') || 'unknown';
        EventBus.fire('lender_card_expanded', { lender: lender });
        Session.addLenderInteraction(lender);
      }

      // "Why ranked here?" modal
      var whyBtn = e.target.closest('[data-why-ranked], .wiq-why-btn');
      if (whyBtn) {
        EventBus.fire('why_ranked_opened', { lender: whyBtn.getAttribute('data-lender') || 'unknown' });
      }

      // Tooltip
      var tooltipTrigger = e.target.closest('.wiq-tooltip-trigger, [data-tooltip]');
      if (tooltipTrigger) {
        EventBus.fire('tooltip_opened', { term: tooltipTrigger.getAttribute('data-tooltip') || 'unknown' });
      }
    });

    // Calculator amount input
    var calcAmount = document.querySelector('#wiq-calc-amount, [data-calc-amount]');
    if (calcAmount) {
      calcAmount.addEventListener('change', function () {
        var raw = parseInt(this.value, 10) || 0;
        var binned = Math.round(raw / 5000) * 5000; // Bin to $5K for privacy
        EventBus.fire('calculator_amount_set', { amount_bin: binned });
        Session.setCalculatorUsed();
      });
    }

    // Calculator term buttons
    document.addEventListener('click', function (e) {
      var termBtn = e.target.closest('[data-calc-term]');
      if (termBtn) {
        EventBus.fire('calculator_term_set', { term: termBtn.getAttribute('data-calc-term') });
        Session.setCalculatorUsed();
      }
    });

    // Payment result viewed (calculator output rendered)
    document.addEventListener('wiq:payment_calculated', function () {
      EventBus.fire('payment_viewed', {});
    });
  }

  // ── Return Visit Detection ─────────────────────────────────────
  function _detectReturnVisit() {
    var VISIT_KEY = 'wiq_last_visit';
    var last = localStorage.getItem(VISIT_KEY);
    var now = Date.now();
    if (last && (now - parseInt(last, 10)) < 7 * 24 * 60 * 60 * 1000) {
      EventBus.fire('return_visit', { days_since: Math.floor((now - parseInt(last, 10)) / 86400000) });
      Session.pageCount > 1 && EventBus.fire('multi_page_session', {});
    }
    localStorage.setItem(VISIT_KEY, now.toString());
  }

  // ── Referral Source Detection ──────────────────────────────────
  function _detectReferralSource() {
    var ref = document.referrer;
    var utmSource = new URLSearchParams(window.location.search).get('utm_source');
    if (utmSource === 'organic' || (ref && /google|bing|yahoo|duckduckgo/.test(ref))) {
      EventBus.fire('organic_landing', { source: utmSource || 'organic' });
    }
    // Detect back-navigation from partner site
    if (ref && /upstart|sofi|lendingclub|marcus|discover|lightstream|besteg|upgrade/.test(ref)) {
      EventBus.fire('back_from_partner', { partner: ref });
    }
  }

  // ── Public API ─────────────────────────────────────────────────
  window.WIQTelemetry = {
    fire: function (eventType, payload) {
      EventBus.fire(eventType, payload);
    },
    getSIS: function () {
      return SIS.get();
    },
    getSession: function () {
      return {
        id: Session.id,
        pageCount: Session.pageCount,
        categories: Session.productCategories,
        creditBand: Session.creditBand,
        calculatorUsed: Session.calculatorUsed,
        lenders: Session.lenderInteractions,
        sis: SIS.get()
      };
    },
    getCohort: function () {
      return sessionStorage.getItem(CONFIG.cohortKey);
    }
  };

  // ── Initialise ─────────────────────────────────────────────────
  function init() {
    Session.init();
    SIS.init();
    EventBus.init();

    // Fire page view
    var cat = _getProductCategory();
    Session.addCategory(cat);
    EventBus.fire('page_view', { category: cat });

    // Detect context
    _detectReturnVisit();
    _detectReferralSource();

    // Attach trackers
    _initScrollTracking();
    _initTimeTracking();

    // Defer interaction tracking until DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        _initCTATracking();
        _initInteractionTracking();
      });
    } else {
      _initCTATracking();
      _initInteractionTracking();
    }
  }

  // Run immediately (script is loaded async/defer)
  init();

}(window, document));
