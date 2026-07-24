/**
 * WiseIQ Calculator Slider System
 * Syncs range sliders with number inputs bidirectionally.
 * Auto-initializes on DOMContentLoaded.
 */
(function () {
  'use strict';

  /**
   * Update the slider's fill gradient percentage
   */
  function updateSliderFill(slider) {
    var min = parseFloat(slider.min) || 0;
    var max = parseFloat(slider.max) || 100;
    var val = parseFloat(slider.value) || 0;
    var pct = ((val - min) / (max - min)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    slider.style.setProperty('--pct', pct.toFixed(1) + '%');
  }

  /**
   * Format a number for display in the number input
   */
  function formatForInput(val, step) {
    var s = parseFloat(step) || 1;
    if (s < 0.01) return parseFloat(val).toFixed(3);
    if (s < 0.1) return parseFloat(val).toFixed(2);
    if (s < 1) return parseFloat(val).toFixed(1);
    return Math.round(parseFloat(val)).toString();
  }

  /**
   * Wire a number input to its paired range slider
   */
  function wireSliderPair(numInput, rangeSlider) {
    // Set initial fill
    updateSliderFill(rangeSlider);

    // Slider → number input
    rangeSlider.addEventListener('input', function () {
      numInput.value = formatForInput(rangeSlider.value, rangeSlider.step);
      updateSliderFill(rangeSlider);
      // Trigger the calc function
      numInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Number input → slider
    numInput.addEventListener('input', function () {
      var v = parseFloat(numInput.value);
      if (!isNaN(v)) {
        var min = parseFloat(rangeSlider.min);
        var max = parseFloat(rangeSlider.max);
        if (!isNaN(min) && v < min) v = min;
        if (!isNaN(max) && v > max) v = max;
        rangeSlider.value = v;
        updateSliderFill(rangeSlider);
      }
    });

    // Keep fill updated on programmatic changes
    numInput.addEventListener('change', function () {
      var v = parseFloat(numInput.value);
      if (!isNaN(v)) {
        rangeSlider.value = v;
        updateSliderFill(rangeSlider);
      }
    });
  }

  /**
   * Find all range sliders on the page and wire them to their number inputs
   */
  function initSliders() {
    var sliders = document.querySelectorAll('input[type="range"][data-sync]');
    sliders.forEach(function (slider) {
      var targetId = slider.getAttribute('data-sync');
      var numInput = document.getElementById(targetId);
      if (numInput && numInput.type === 'number') {
        wireSliderPair(numInput, slider);
      }
    });

    // Also handle sliders that are siblings of number inputs in .calc-field-row
    var rows = document.querySelectorAll('.calc-field-row');
    rows.forEach(function (row) {
      var numInput = row.querySelector('input[type="number"]');
      var rangeSlider = row.querySelector('input[type="range"]');
      if (numInput && rangeSlider && !rangeSlider.getAttribute('data-sync')) {
        wireSliderPair(numInput, rangeSlider);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSliders);
  } else {
    initSliders();
  }

  // Expose for manual re-init if needed
  window.WiseIQSliders = { init: initSliders, updateFill: updateSliderFill };
})();
