(function () {
  'use strict';

  /* ── Helpers ────────────────────────────────────────────────── */
  function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function fmt$(n)  { return '$' + Math.round(n).toLocaleString(); }
  function fmtPct(n){ return n.toFixed(2) + '%'; }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ── Page context detection ─────────────────────────────────── */
  var path = window.location.pathname.toLowerCase();
  var MODE = null;
  if (/balance.transfer/.test(path)) MODE = 'bt';
  else if (/mortgage/.test(path)) MODE = 'mortgage';
  else if (/personal.loan|debt.consolidat/.test(path)) MODE = 'loan';

  /* ── Incumbent comparison data ──────────────────────────────── */
  var INCUMBENT_FRICTION = {
    bt: {
      name: 'NerdWallet Balance Transfer Calculator',
      steps: 4,
      avgTimeMin: 3.5,
      label: 'NerdWallet\'s 4-step form'
    },
    mortgage: {
      name: 'Bankrate Mortgage Calculator',
      steps: 6,
      avgTimeMin: 5,
      label: 'Bankrate\'s 6-step form'
    },
    loan: {
      name: 'Credit Karma Loan Calculator',
      steps: 3,
      avgTimeMin: 2.5,
      label: 'Credit Karma\'s 3-step form'
    }
  };

  /* ── Smart defaults from page context ──────────────────────── */
  function getSmartDefaults() {
    var d = {};
    // Try to extract from existing page elements
    var aprEl = qs('.stat-value, .apy-badge, .compact-rate-banner span[style*="font-weight:800"]');
    if (aprEl) {
      var aprMatch = aprEl.textContent.match(/([\d.]+)%/);
      if (aprMatch) d.apr = parseFloat(aprMatch[1]);
    }
    // Extract loan amount from URL or page heading
    var h1 = qs('h1');
    if (h1) {
      var amtMatch = h1.textContent.match(/\$?([\d,]+)k?\b/i);
      if (amtMatch) {
        var amt = parseFloat(amtMatch[1].replace(/,/g, ''));
        if (amtMatch[0].toLowerCase().includes('k')) amt *= 1000;
        if (amt >= 1000 && amt <= 100000) d.amount = amt;
      }
    }
    return d;
  }

  /* ══════════════════════════════════════════════════════════════
   * BALANCE TRANSFER CALCULATOR
   * ══════════════════════════════════════════════════════════════ */
  function buildBTCalc(container) {
    var defaults = getSmartDefaults();
    var html =
      '<div class="wiq-ic-header">' +
        '<div class="wiq-ic-title">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
          'Balance Transfer Savings Calculator' +
        '</div>' +
        '<div class="wiq-ic-vs-badge">vs. ' + INCUMBENT_FRICTION.bt.label + ' (' + INCUMBENT_FRICTION.bt.steps + ' steps)</div>' +
      '</div>' +
      '<div class="wiq-ic-body">' +
        '<div class="wiq-ic-inputs">' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-bt-balance">Current Balance</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-prefix-$">' +
              '<input class="wiq-ic-input" id="wiq-bt-balance" type="number" min="500" max="100000" value="5000" step="100"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="500" max="50000" step="100" value="5000" data-target="wiq-bt-balance"/>' +
          '</div>' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-bt-current-apr">Current Card APR</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-suffix-%">' +
              '<input class="wiq-ic-input" id="wiq-bt-current-apr" type="number" min="1" max="36" value="24.99" step="0.01"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="1" max="36" step="0.01" value="24.99" data-target="wiq-bt-current-apr"/>' +
          '</div>' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-bt-promo">0% Promo Period</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-suffix-mo">' +
              '<input class="wiq-ic-input" id="wiq-bt-promo" type="number" min="6" max="24" value="21" step="1"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="6" max="24" step="1" value="21" data-target="wiq-bt-promo"/>' +
          '</div>' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-bt-fee">Transfer Fee</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-suffix-%">' +
              '<input class="wiq-ic-input" id="wiq-bt-fee" type="number" min="0" max="5" value="3" step="0.1"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="0" max="5" step="0.1" value="3" data-target="wiq-bt-fee"/>' +
          '</div>' +
        '</div>' +
        '<div class="wiq-ic-results">' +
          '<div class="wiq-ic-result-hero">' +
            '<div class="wiq-ic-result-label">Interest Saved</div>' +
            '<div class="wiq-ic-result-value" id="wiq-bt-saved">—</div>' +
          '</div>' +
          '<div class="wiq-ic-result-grid">' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Transfer Fee Cost</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-bt-fee-cost">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Net Savings</div>' +
              '<div class="wiq-ic-result-item-value wiq-ic-green" id="wiq-bt-net">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Monthly Payment Needed</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-bt-monthly">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Break-Even Month</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-bt-breakeven">—</div>' +
            '</div>' +
          '</div>' +
          '<div class="wiq-ic-cta-row" id="wiq-bt-cta-row">' +
            '<a href="/pages/best-balance-transfer-credit-cards.html" class="wiq-ic-cta-btn">' +
              'Find the Best 0% APR Card for Your Balance →' +
            '</a>' +
            '<div class="wiq-ic-cta-note">No hard credit pull to check your options</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
    wireSliders(container);

    function calc() {
      var balance = parseFloat(qs('#wiq-bt-balance', container).value) || 0;
      var currentApr = parseFloat(qs('#wiq-bt-current-apr', container).value) || 0;
      var promo = parseInt(qs('#wiq-bt-promo', container).value) || 0;
      var feePct = parseFloat(qs('#wiq-bt-fee', container).value) || 0;

      var monthlyRate = currentApr / 100 / 12;
      var interestSaved = balance * monthlyRate * promo;
      var feeCost = balance * feePct / 100;
      var netSavings = interestSaved - feeCost;
      var monthlyNeeded = balance / promo;
      var breakEven = feeCost > 0 ? Math.ceil(feeCost / (balance * monthlyRate)) : 0;

      qs('#wiq-bt-saved', container).textContent = fmt$(interestSaved);
      qs('#wiq-bt-fee-cost', container).textContent = fmt$(feeCost);
      var netEl = qs('#wiq-bt-net', container);
      netEl.textContent = fmt$(netSavings);
      netEl.style.color = netSavings > 0 ? '#15803D' : '#DC2626';
      qs('#wiq-bt-monthly', container).textContent = fmt$(monthlyNeeded) + '/mo';
      qs('#wiq-bt-breakeven', container).textContent = breakEven > 0 ? 'Month ' + breakEven : 'Immediate';
    }

    qsa('.wiq-ic-input', container).forEach(function (inp) {
      inp.addEventListener('input', calc);
    });
    calc();
  }

  /* ══════════════════════════════════════════════════════════════
   * MORTGAGE CALCULATOR (single-screen upgrade)
   * ══════════════════════════════════════════════════════════════ */
  function buildMortgageCalc(container) {
    var html =
      '<div class="wiq-ic-header">' +
        '<div class="wiq-ic-title">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
          'Mortgage Payment Calculator' +
        '</div>' +
        '<div class="wiq-ic-vs-badge">vs. ' + INCUMBENT_FRICTION.mortgage.label + ' (' + INCUMBENT_FRICTION.mortgage.steps + ' steps)</div>' +
      '</div>' +
      '<div class="wiq-ic-body">' +
        '<div class="wiq-ic-inputs">' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-mg-price">Home Price</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-prefix-$">' +
              '<input class="wiq-ic-input" id="wiq-mg-price" type="number" min="50000" max="5000000" value="400000" step="5000"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="50000" max="2000000" step="5000" value="400000" data-target="wiq-mg-price"/>' +
          '</div>' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-mg-down">Down Payment</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-suffix-%">' +
              '<input class="wiq-ic-input" id="wiq-mg-down" type="number" min="3" max="50" value="20" step="0.5"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="3" max="50" step="0.5" value="20" data-target="wiq-mg-down"/>' +
          '</div>' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-mg-rate">Interest Rate</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-suffix-%">' +
              '<input class="wiq-ic-input" id="wiq-mg-rate" type="number" min="2" max="15" value="6.875" step="0.001"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="2" max="15" step="0.001" value="6.875" data-target="wiq-mg-rate"/>' +
          '</div>' +
          '<div class="wiq-ic-field wiq-ic-field-select">' +
            '<label class="wiq-ic-label" for="wiq-mg-term">Loan Term</label>' +
            '<select class="wiq-ic-select" id="wiq-mg-term">' +
              '<option value="30" selected>30 years</option>' +
              '<option value="20">20 years</option>' +
              '<option value="15">15 years</option>' +
              '<option value="10">10 years</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="wiq-ic-results">' +
          '<div class="wiq-ic-result-hero">' +
            '<div class="wiq-ic-result-label">Monthly Payment (P&I)</div>' +
            '<div class="wiq-ic-result-value" id="wiq-mg-monthly">—</div>' +
          '</div>' +
          '<div class="wiq-ic-result-grid">' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Loan Amount</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-mg-loan">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Total Interest</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-mg-total-int">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Total Cost</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-mg-total-cost">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">PMI (if &lt;20% down)</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-mg-pmi">—</div>' +
            '</div>' +
          '</div>' +
          '<div class="wiq-ic-rate-compare" id="wiq-mg-rate-compare"></div>' +
          '<div class="wiq-ic-cta-row">' +
            '<a href="/pages/mortgages.html" class="wiq-ic-cta-btn">' +
              'Compare Today\'s Mortgage Rates →' +
            '</a>' +
            '<div class="wiq-ic-cta-note">Soft pull only — no credit score impact</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
    wireSliders(container);

    function calc() {
      var price = parseFloat(qs('#wiq-mg-price', container).value) || 0;
      var downPct = parseFloat(qs('#wiq-mg-down', container).value) || 0;
      var rate = parseFloat(qs('#wiq-mg-rate', container).value) || 0;
      var term = parseInt(qs('#wiq-mg-term', container).value) || 30;

      var loanAmt = price * (1 - downPct / 100);
      var monthlyRate = rate / 100 / 12;
      var n = term * 12;
      var monthly = monthlyRate > 0
        ? loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
        : loanAmt / n;
      var totalInt = monthly * n - loanAmt;
      var totalCost = monthly * n;
      var pmi = downPct < 20 ? (loanAmt * 0.01 / 12) : 0;

      qs('#wiq-mg-monthly', container).textContent = fmt$(monthly);
      qs('#wiq-mg-loan', container).textContent = fmt$(loanAmt);
      qs('#wiq-mg-total-int', container).textContent = fmt$(totalInt);
      qs('#wiq-mg-total-cost', container).textContent = fmt$(totalCost);
      qs('#wiq-mg-pmi', container).textContent = pmi > 0 ? fmt$(pmi) + '/mo' : 'None';

      // Rate comparison vs national average
      var natAvg = 7.02;
      var rateCompEl = qs('#wiq-mg-rate-compare', container);
      if (rate < natAvg) {
        var savingsPerMonth = (loanAmt * (natAvg / 100 / 12) * Math.pow(1 + natAvg / 100 / 12, n) /
          (Math.pow(1 + natAvg / 100 / 12, n) - 1)) - monthly;
        rateCompEl.innerHTML =
          '<div class="wiq-ic-rate-compare-inner wiq-ic-green-bg">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' +
            'Your rate (' + fmtPct(rate) + ') is below the national average (' + fmtPct(natAvg) + '). ' +
            'You\'re saving <strong>' + fmt$(savingsPerMonth) + '/mo</strong> vs. the average borrower.' +
          '</div>';
      } else if (rate > natAvg + 0.5) {
        var extraPerMonth = monthly - (loanAmt * (natAvg / 100 / 12) * Math.pow(1 + natAvg / 100 / 12, n) /
          (Math.pow(1 + natAvg / 100 / 12, n) - 1));
        rateCompEl.innerHTML =
          '<div class="wiq-ic-rate-compare-inner wiq-ic-amber-bg">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
            'Your rate (' + fmtPct(rate) + ') is above the national average (' + fmtPct(natAvg) + '). ' +
            'Shopping lenders could save you <strong>' + fmt$(extraPerMonth) + '/mo</strong>.' +
          '</div>';
      } else {
        rateCompEl.innerHTML = '';
      }
    }

    qsa('.wiq-ic-input, .wiq-ic-select', container).forEach(function (inp) {
      inp.addEventListener('input', calc);
      inp.addEventListener('change', calc);
    });
    calc();
  }

  /* ══════════════════════════════════════════════════════════════
   * PERSONAL LOAN CALCULATOR
   * ══════════════════════════════════════════════════════════════ */
  function buildLoanCalc(container) {
    var defaults = getSmartDefaults();
    var defaultAmt = defaults.amount || 10000;
    var defaultApr = defaults.apr || 12.99;

    var html =
      '<div class="wiq-ic-header">' +
        '<div class="wiq-ic-title">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' +
          'Personal Loan Payment Calculator' +
        '</div>' +
        '<div class="wiq-ic-vs-badge">vs. ' + INCUMBENT_FRICTION.loan.label + ' (' + INCUMBENT_FRICTION.loan.steps + ' steps)</div>' +
      '</div>' +
      '<div class="wiq-ic-body">' +
        '<div class="wiq-ic-inputs">' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-ln-amount">Loan Amount</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-prefix-$">' +
              '<input class="wiq-ic-input" id="wiq-ln-amount" type="number" min="1000" max="100000" value="' + defaultAmt + '" step="500"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="1000" max="50000" step="500" value="' + defaultAmt + '" data-target="wiq-ln-amount"/>' +
          '</div>' +
          '<div class="wiq-ic-field">' +
            '<label class="wiq-ic-label" for="wiq-ln-apr">APR</label>' +
            '<div class="wiq-ic-input-wrap wiq-ic-suffix-%">' +
              '<input class="wiq-ic-input" id="wiq-ln-apr" type="number" min="3" max="36" value="' + defaultApr + '" step="0.01"/>' +
            '</div>' +
            '<input class="wiq-ic-slider" type="range" min="3" max="36" step="0.01" value="' + defaultApr + '" data-target="wiq-ln-apr"/>' +
          '</div>' +
          '<div class="wiq-ic-field wiq-ic-field-select">' +
            '<label class="wiq-ic-label" for="wiq-ln-term">Loan Term</label>' +
            '<select class="wiq-ic-select" id="wiq-ln-term">' +
              '<option value="24">2 years</option>' +
              '<option value="36" selected>3 years</option>' +
              '<option value="48">4 years</option>' +
              '<option value="60">5 years</option>' +
              '<option value="72">6 years</option>' +
              '<option value="84">7 years</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="wiq-ic-results">' +
          '<div class="wiq-ic-result-hero">' +
            '<div class="wiq-ic-result-label">Monthly Payment</div>' +
            '<div class="wiq-ic-result-value" id="wiq-ln-monthly">—</div>' +
          '</div>' +
          '<div class="wiq-ic-result-grid">' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Total Interest</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-ln-interest">—</div>' +
            '</div>' +
            '<div class="wiq-ic-result-item">' +
              '<div class="wiq-ic-result-item-label">Total Cost</div>' +
              '<div class="wiq-ic-result-item-value" id="wiq-ln-total">—</div>' +
            '</div>' +
          '</div>' +
          '<div class="wiq-ic-rate-compare" id="wiq-ln-rate-compare"></div>' +
          '<div class="wiq-ic-cta-row">' +
            '<a href="/pages/personal-loans.html" class="wiq-ic-cta-btn">' +
              'Check Your Rate — No Hard Pull →' +
            '</a>' +
            '<div class="wiq-ic-cta-note">Soft pull only · Results in 2 minutes</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
    wireSliders(container);

    function calc() {
      var amount = parseFloat(qs('#wiq-ln-amount', container).value) || 0;
      var apr = parseFloat(qs('#wiq-ln-apr', container).value) || 0;
      var term = parseInt(qs('#wiq-ln-term', container).value) || 36;

      var monthlyRate = apr / 100 / 12;
      var monthly = monthlyRate > 0
        ? amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
        : amount / term;
      var totalInt = monthly * term - amount;

      qs('#wiq-ln-monthly', container).textContent = fmt$(monthly);
      qs('#wiq-ln-interest', container).textContent = fmt$(totalInt);
      qs('#wiq-ln-total', container).textContent = fmt$(monthly * term);

      // Rate comparison
      var natAvgApr = 12.35;
      var rateCompEl = qs('#wiq-ln-rate-compare', container);
      if (apr < natAvgApr - 1) {
        var avgMonthly = amount * (natAvgApr / 100 / 12 * Math.pow(1 + natAvgApr / 100 / 12, term)) /
          (Math.pow(1 + natAvgApr / 100 / 12, term) - 1);
        rateCompEl.innerHTML =
          '<div class="wiq-ic-rate-compare-inner wiq-ic-green-bg">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' +
            'Great rate! You\'re saving <strong>' + fmt$((avgMonthly - monthly) * term) + '</strong> vs. the national average APR of ' + fmtPct(natAvgApr) + '.' +
          '</div>';
      } else if (apr > natAvgApr + 3) {
        rateCompEl.innerHTML =
          '<div class="wiq-ic-rate-compare-inner wiq-ic-amber-bg">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
            'Your APR (' + fmtPct(apr) + ') is above average. Checking pre-qualified rates takes 2 minutes and won\'t hurt your score.' +
          '</div>';
      } else {
        rateCompEl.innerHTML = '';
      }
    }

    qsa('.wiq-ic-input, .wiq-ic-select', container).forEach(function (inp) {
      inp.addEventListener('input', calc);
      inp.addEventListener('change', calc);
    });
    calc();
  }

  /* ── Slider sync ────────────────────────────────────────────── */
  function wireSliders(container) {
    qsa('.wiq-ic-slider', container).forEach(function (slider) {
      var targetId = slider.getAttribute('data-target');
      var input = qs('#' + targetId, container);
      if (!input) return;

      function updateFill() {
        var min = parseFloat(slider.min) || 0;
        var max = parseFloat(slider.max) || 100;
        var val = parseFloat(slider.value) || 0;
        var pct = ((val - min) / (max - min)) * 100;
        slider.style.setProperty('--pct', pct.toFixed(1) + '%');
      }

      slider.addEventListener('input', function () {
        input.value = slider.value;
        updateFill();
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      input.addEventListener('input', function () {
        var v = parseFloat(input.value);
        if (!isNaN(v)) {
          slider.value = Math.min(Math.max(v, parseFloat(slider.min)), parseFloat(slider.max));
          updateFill();
        }
      });
      updateFill();
    });
  }

  /* ── Mount point injection ──────────────────────────────────── */
  function injectCalcWidget() {
    // Check if already injected
    if (qs('.wiq-instant-calc')) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'wiq-instant-calc';

    if (MODE === 'bt') {
      // Inject after the first h2 on balance transfer pages
      var h2 = qs('h2');
      if (h2) h2.parentNode.insertBefore(wrapper, h2.nextSibling);
      else document.body.appendChild(wrapper);
      buildBTCalc(wrapper);
    } else if (MODE === 'mortgage') {
      // On the mortgage calculator page, replace the existing calc panel
      var calcPanel = qs('.calc-panel, .calc-grid, #calc-wrap');
      if (calcPanel) {
        calcPanel.parentNode.insertBefore(wrapper, calcPanel);
        calcPanel.style.display = 'none';
      } else {
        var h1 = qs('h1');
        if (h1) h1.parentNode.insertBefore(wrapper, h1.nextSibling);
      }
      buildMortgageCalc(wrapper);
    } else if (MODE === 'loan') {
      // Inject after the affiliate disclosure banner on loan pages
      var banner = qs('.affiliate-disclosure-banner');
      if (banner) banner.parentNode.insertBefore(wrapper, banner.nextSibling);
      else {
        var h2 = qs('h2');
        if (h2) h2.parentNode.insertBefore(wrapper, h2.nextSibling);
      }
      buildLoanCalc(wrapper);
    }
  }

  /* ── Init ───────────────────────────────────────────────────── */
  if (MODE) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectCalcWidget);
    } else {
      injectCalcWidget();
    }
  }
})();
