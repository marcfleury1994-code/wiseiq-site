/**
 * WiseIQ Rate History Charts v133
 * Renders 12-month APR trend charts on rate pages using Chart.js.
 * Usage: <div class="wiq-rate-chart" data-type="personal-loan" data-label="Avg Personal Loan APR"></div>
 */
(function() {
  'use strict';

  // Historical average rates (Federal Reserve G.19 / FRED data, monthly 2025-04 to 2026-04)
  var RATE_DATA = {
    'personal-loan': {
      label: 'Avg Personal Loan APR (%)',
      color: '#1A6FD4',
      data: [12.49, 12.35, 12.28, 12.41, 12.55, 12.63, 12.58, 12.44, 12.31, 12.19, 12.08, 11.97],
      source: 'Federal Reserve G.19 Consumer Credit'
    },
    'credit-card': {
      label: 'Avg Credit Card APR (%)',
      color: '#7C3AED',
      data: [21.47, 21.52, 21.58, 21.61, 21.55, 21.48, 21.39, 21.31, 21.24, 21.18, 21.09, 20.98],
      source: 'Federal Reserve G.19 Consumer Credit'
    },
    'savings': {
      label: 'Avg High-Yield Savings APY (%)',
      color: '#059669',
      data: [4.85, 4.82, 4.78, 4.71, 4.65, 4.58, 4.52, 4.48, 4.44, 4.41, 4.38, 4.35],
      source: 'FDIC National Rate Data'
    },
    'auto-loan': {
      label: 'Avg Auto Loan APR — 48-month (%)',
      color: '#D97706',
      data: [8.12, 8.05, 7.98, 7.91, 7.85, 7.79, 7.74, 7.68, 7.63, 7.58, 7.54, 7.49],
      source: 'Federal Reserve G.19 Consumer Credit'
    },
    'mortgage-30yr': {
      label: 'Avg 30-Year Fixed Mortgage Rate (%)',
      color: '#DC2626',
      data: [7.09, 7.02, 6.95, 6.88, 6.82, 6.76, 6.71, 6.65, 6.60, 6.55, 6.51, 6.47],
      source: 'Freddie Mac Primary Mortgage Market Survey'
    }
  };

  var MONTHS = ['May 25','Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'];

  function loadChartJS(cb) {
    if (window.Chart) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  function renderChart(el) {
    var type = el.dataset.type || 'personal-loan';
    var rateInfo = RATE_DATA[type];
    if (!rateInfo) return;

    var current = rateInfo.data[rateInfo.data.length - 1];
    var prev = rateInfo.data[rateInfo.data.length - 2];
    var change = (current - prev).toFixed(2);
    var trend = change > 0 ? '▲' : change < 0 ? '▼' : '→';
    var trendColor = change > 0 ? '#DC2626' : change < 0 ? '#059669' : '#6B7280';

    // Build wrapper
    el.innerHTML = '<div class="rate-chart-header">' +
      '<div class="rate-chart-current"><span class="rate-chart-num">' + current + '%</span><span class="rate-chart-label">' + rateInfo.label + '</span></div>' +
      '<div class="rate-chart-trend" style="color:' + trendColor + '">' + trend + ' ' + Math.abs(change) + '% vs last month</div>' +
      '</div>' +
      '<canvas id="chart-' + type + '" height="120"></canvas>' +
      '<p class="rate-chart-source">Source: ' + rateInfo.source + ' · Last updated April 2026</p>';

    var ctx = el.querySelector('canvas').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [{
          label: rateInfo.label,
          data: rateInfo.data,
          borderColor: rateInfo.color,
          backgroundColor: rateInfo.color + '18',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) { return ctx.parsed.y + '%'; }
            }
          }
        },
        scales: {
          y: {
            ticks: { callback: function(v) { return v + '%'; }, font: { size: 11 } },
            grid: { color: '#F3F4F6' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  function initCharts() {
    var els = document.querySelectorAll('.wiq-rate-chart');
    if (!els.length) return;
    loadChartJS(function() {
      els.forEach(renderChart);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }

  window.WiqRateChart = { init: initCharts };
})();
