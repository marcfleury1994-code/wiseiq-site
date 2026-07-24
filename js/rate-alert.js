/**
 * WiseIQ Rate Alert — shared handler
 * Replaces all inline handleRateAlert() functions across the site.
 * Submits to Mailchimp with a "rate_alert" tag and the page topic as a second tag.
 */
(function () {
  var MC_URL = 'https://wiseiq.us3.list-manage.com/subscribe/post-json?u=838b18a1b76ada5ecaa074e1e&id=5619c3a158&f_id=00e845e3f0';

  function getPageTag() {
    var path = window.location.pathname;
    if (/mortgage/i.test(path)) return 'mortgage_rates';
    if (/auto.loan/i.test(path)) return 'auto_loan_rates';
    if (/heloc/i.test(path)) return 'heloc_rates';
    if (/savings|money.market/i.test(path)) return 'savings_rates';
    if (/credit.card/i.test(path)) return 'credit_card_rates';
    if (/personal.loan/i.test(path)) return 'personal_loan_rates';
    if (/student.loan/i.test(path)) return 'student_loan_rates';
    return 'general_rates';
  }

  function submitRateAlert(email, successEl, btnEl) {
    var tag = getPageTag();
    var url = MC_URL
      + '&EMAIL=' + encodeURIComponent(email)
      + '&SOURCE=rate_alert'
      + '&TAGS=' + encodeURIComponent('rate_alert,' + tag)
      + '&c=wiqRateAlertCb';

    btnEl.textContent = 'Sending…';
    btnEl.disabled = true;

    window.wiqRateAlertCb = function (data) {
      if (data.result === 'success' || data.result === 'error' && /already subscribed/i.test(data.msg)) {
        successEl.innerHTML = '<span style="color:#15803D;font-weight:600;font-size:14px;">✓ You\'re on the list! We\'ll alert you when rates change.</span>';
        successEl.style.display = 'block';
        if (successEl.closest('form')) successEl.closest('form').style.display = 'none';
      } else {
        btnEl.textContent = 'Notify Me';
        btnEl.disabled = false;
        successEl.innerHTML = '<span style="color:#DC2626;font-size:13px;">Something went wrong — please try again.</span>';
        successEl.style.display = 'block';
      }
    };

    var s = document.createElement('script');
    s.src = url;
    document.head.appendChild(s);
  }

  // Global handler called by inline onsubmit="handleRateAlert(event,this)"
  window.handleRateAlert = function (e, form) {
    e.preventDefault();
    var emailInput = form.querySelector('input[type=email]');
    var btn = form.querySelector('button[type=submit]');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email || !email.includes('@')) return;

    // Create or find success message element
    var successEl = form.nextElementSibling;
    if (!successEl || !successEl.classList.contains('rate-alert-success')) {
      successEl = document.createElement('div');
      successEl.className = 'rate-alert-success';
      successEl.style.display = 'none';
      form.parentNode.insertBefore(successEl, form.nextSibling);
    }

    submitRateAlert(email, successEl, btn);
  };

  // Also wire up any .rate-alert-form elements that use addEventListener
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.rate-alert-form').forEach(function (form) {
      if (!form.dataset.wiqWired) {
        form.dataset.wiqWired = '1';
        form.addEventListener('submit', function (e) {
          window.handleRateAlert(e, form);
        });
      }
    });

    // Update button colors to match new teal brand
    document.querySelectorAll('.rate-alert-form button[type=submit]').forEach(function (btn) {
      btn.style.background = '#00b894';
    });
  });
})();
