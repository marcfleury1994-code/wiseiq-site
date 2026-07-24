/* WiseIQ Rate Explorer — honest loan math, no email gate.
   Renders into any <div class="wiq-rx" data-theme="dark|light" data-compact></div> */
(function () {
  'use strict';

  var UP = 'https://upstart.9c65.net/9VW6GY';

  // Honest 2026 APR ranges by score tier (major online lenders, 3–5yr unsecured)
  var TIERS = [
    { min: 780, name: 'Exceptional', lo: 7.0,  hi: 11.0, cls: 'g' },
    { min: 740, name: 'Very good',   lo: 8.0,  hi: 13.0, cls: 'g' },
    { min: 700, name: 'Good',        lo: 11.0, hi: 18.0, cls: 'b' },
    { min: 660, name: 'Fair–good',   lo: 14.0, hi: 24.0, cls: 'b' },
    { min: 620, name: 'Fair',        lo: 19.0, hi: 30.0, cls: 'a' },
    { min: 580, name: 'Fair–low',    lo: 24.0, hi: 34.0, cls: 'a' },
    { min: 300, name: 'Rebuilding',  lo: 27.0, hi: 36.0, cls: 'r' }
  ];

  var fmt$ = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  function tierFor(score) {
    for (var i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) return TIERS[i];
    return TIERS[TIERS.length - 1];
  }
  function payment(P, apr, months) {
    var r = apr / 100 / 12;
    return P * r / (1 - Math.pow(1 + r, -months));
  }

  // Context-aware default amount by page topic (higher intent pages -> larger, honest defaults)
  function defaultAmount() {
    var p = location.pathname;
    if (/consolidat|debt-relief|credit-card-debt|payoff/.test(p)) return 20000;
    if (/good-credit|how-much/.test(p)) return 20000;
    if (/bad-credit|emergency|rebuilding/.test(p)) return 8000;
    return 15000;
  }

  function loadSaved() {
    try {
      var s = JSON.parse(localStorage.getItem('wiqRx') || 'null');
      if (s && s.score >= 300 && s.amt >= 1000) return s;
    } catch (e) {}
    return null;
  }
  function persist(state) {
    try { localStorage.setItem('wiqRx', JSON.stringify(state)); } catch (e) {}
  }

  function build(root) {
    var compact = root.hasAttribute('data-compact');
    root.innerHTML =
      '<div class="rx-head">' +
        '<div><div class="rx-title">What would a loan really cost you?</div>' +
        '<div class="rx-sub">Honest estimate from 2026 market ranges — no email, no credit pull, no gate.</div></div>' +
        '<span class="rx-live">LIVE MATH</span>' +
      '</div>' +
      '<div class="rx-grid">' +
        '<div class="rx-controls">' +
          '<div class="rx-field"><div class="rx-lrow"><label>Your credit score</label><output class="rx-score-out">660</output></div>' +
            '<input type="range" class="rx-score" min="300" max="850" step="5" value="660" aria-label="Credit score">' +
            '<div class="rx-scale"><span>300</span><span class="rx-tier-chip">Fair–good</span><span>850</span></div></div>' +
          '<div class="rx-field"><div class="rx-lrow"><label>Loan amount</label><output class="rx-amt-out">$15,000</output></div>' +
            '<input type="range" class="rx-amt" min="1000" max="75000" step="1000" value="15000" aria-label="Loan amount">' +
            '<div class="rx-scale"><span>$1K</span><span>$75K</span></div></div>' +
          '<div class="rx-field"><div class="rx-lrow"><label>Term</label></div>' +
            '<div class="rx-terms"><button type="button" data-m="36" class="on">3 years</button><button type="button" data-m="60">5 years</button></div></div>' +
        '</div>' +
        '<div class="rx-results">' +
          '<div class="rx-apr-row"><span class="rx-apr-label">Realistic APR for this profile</span><span class="rx-apr-val">14% – 24%</span></div>' +
          '<div class="rx-pay"><div class="rx-pay-num" aria-live="polite">$519 – $588</div><div class="rx-pay-cap">estimated monthly payment</div></div>' +
          '<div class="rx-int"><span>Total interest over the loan:</span> <strong class="rx-int-val">$3,672 – $6,174</strong></div>' +
          '<div class="rx-bar"><div class="rx-bar-p"></div><div class="rx-bar-i"></div></div>' +
          '<div class="rx-bar-key"><span><i class="k-p"></i>Principal</span><span><i class="k-i"></i>Interest (worst case)</span></div>' +
          '<a class="rx-cta" href="' + UP + '" rel="sponsored noopener" target="_blank">Get your real number at Upstart →</a>' +
          '<div class="rx-fine">That was the estimate. Upstart shows your actual APR in ~2 min with a soft pull — no score impact, no obligation. Paid partner link.</div>' +
        '</div>' +
      '</div>' +
      (compact ? '' : '<div class="rx-note">Estimates use standard amortization across typical 2026 APR ranges at major online lenders (national avg ~12%, Federal Reserve G.19). Your real rate also depends on income and existing debt — often more than your score.</div>');

    var $ = function (s) { return root.querySelector(s); };
    var score = $('.rx-score'), amt = $('.rx-amt');
    var months = 36;
    // restore prior session or apply context default
    var saved = loadSaved();
    if (saved) {
      score.value = saved.score;
      amt.value = saved.amt;
      months = saved.months === 60 ? 60 : 36;
      root.querySelectorAll('.rx-terms button').forEach(function (x) {
        x.classList.toggle('on', +x.getAttribute('data-m') === months);
      });
    } else {
      amt.value = defaultAmount();
    }
    var shown = { pl: 0, ph: 0 }; // for number animation
    var raf = null;

    function paintTrack(el) {
      var pct = (el.value - el.min) / (el.max - el.min) * 100;
      el.style.setProperty('--fill', pct + '%');
    }

    function animateTo(pl, ph, il, ih) {
      if (raf) cancelAnimationFrame(raf);
      var from = { pl: shown.pl || pl, ph: shown.ph || ph };
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min((ts - t0) / 260, 1);
        var e = 1 - Math.pow(1 - k, 3);
        var cpl = from.pl + (pl - from.pl) * e, cph = from.ph + (ph - from.ph) * e;
        $('.rx-pay-num').textContent = fmt$.format(cpl) + ' – ' + fmt$.format(cph);
        if (k < 1) raf = requestAnimationFrame(step);
        else { shown.pl = pl; shown.ph = ph; }
      }
      $('.rx-int-val').textContent = fmt$.format(il) + ' – ' + fmt$.format(ih);
      raf = requestAnimationFrame(step);
    }

    var CTA = {
      r: { t: 'Upstart has no minimum score — see if you qualify →', f: 'Rebuilding credit? Upstart weighs income and employment, not just your score. Soft pull, no obligation. Paid partner link.' },
      a: { t: 'This range is Upstart’s sweet spot — get your real number →', f: 'Fair-credit profiles are where Upstart’s model beats traditional lenders most often. Soft pull, ~2 minutes. Paid partner link.' },
      b: { t: 'Check Upstart’s quote — then compare no-fee lenders →', f: 'At your tier you have options. Get Upstart’s soft-pull number first, then make lenders compete. Paid partner link.' },
      g: { t: 'You’ll qualify nearly anywhere — Upstart takes 2 min to compare →', f: 'Strong credit means you should collect multiple quotes. Upstart’s is a fast, soft-pull data point. Paid partner link.' }
    };
    function update() {
      var s = +score.value, P = +amt.value, t = tierFor(s);
      $('.rx-score-out').textContent = s;
      $('.rx-amt-out').textContent = fmt$.format(P);
      $('.rx-tier-chip').textContent = t.name;
      $('.rx-tier-chip').className = 'rx-tier-chip tc-' + t.cls;
      $('.rx-apr-val').textContent = t.lo.toFixed(0) + '% – ' + t.hi.toFixed(0) + '%';
      var c = CTA[t.cls] || CTA.b;
      $('.rx-cta').textContent = c.t;
      $('.rx-fine').textContent = c.f;
      var pl = payment(P, t.lo, months), ph = payment(P, t.hi, months);
      var il = pl * months - P, ih = ph * months - P;
      animateTo(pl, ph, il, ih);
      var frac = P / (P + ih);
      $('.rx-bar-p').style.width = (frac * 100).toFixed(1) + '%';
      $('.rx-bar-i').style.width = ((1 - frac) * 100).toFixed(1) + '%';
      paintTrack(score); paintTrack(amt);
      persist({ score: s, amt: P, months: months, pl: Math.round(pl), ph: Math.round(ph), tier: t.name, ts: Date.now() });
    }

    score.addEventListener('input', update);
    amt.addEventListener('input', update);
    root.querySelectorAll('.rx-terms button').forEach(function (b) {
      b.addEventListener('click', function () {
        months = +b.getAttribute('data-m');
        root.querySelectorAll('.rx-terms button').forEach(function (x) { x.classList.toggle('on', x === b); });
        update();
      });
    });
    update();
  }

  function init() {
    document.querySelectorAll('.wiq-rx').forEach(build);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
