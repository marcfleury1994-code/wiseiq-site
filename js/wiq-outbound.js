/* WiseIQ outbound affiliate click attribution.
   1. Fires a GA4 event with partner + placement + page on every partner-link click.
   2. Appends Impact subId1 (page--placement) to Upstart/Coinbase links at click time,
      so conversions are attributable per placement in the partner dashboard.
   Fully defensive: any failure means the link just works normally. */
(function () {
  'use strict';

  var PARTNERS = [
    { match: '9c65.net', name: 'upstart', subid: true },
    { match: 'sjv.io', name: 'coinbase', subid: true },
    { match: 'stockanalysis.com', name: 'stockanalysis', subid: false }
  ];

  function partnerFor(href) {
    for (var i = 0; i < PARTNERS.length; i++)
      if (href.indexOf(PARTNERS[i].match) > -1) return PARTNERS[i];
    return null;
  }

  function placementOf(el) {
    try {
      var map = [
        ['.nav-cta', 'nav'], ['.mobile-menu', 'mobile_menu'],
        ['.rx-cta', 'rate_explorer'], ['.wiq-callout', 'callout'],
        ['.inline-offer', 'inline_offer'], ['aside', 'sidebar'],
        ['.wiq-receipt', 'receipt'], ['.calc-cta-box', 'calculator'],
        ['.offer-card', 'offer_card'], ['.rc-foot', 'hero_chart'],
        ['.foot-cta', 'foot_cta'], ['.money-cell', 'who_pays'],
        ['.sticky-cat-cta', 'sticky_bar'], ['footer', 'footer'],
        ['.wiq-partner-row', 'table_row'], ['.hero', 'hero']
      ];
      for (var i = 0; i < map.length; i++)
        if (el.closest && el.closest(map[i][0])) return map[i][1];
    } catch (e) {}
    return 'content';
  }

  function pageSlug() {
    var p = location.pathname.replace(/^\/pages\//, '').replace(/\.html$/, '').replace(/\//g, '') || 'home';
    return p.slice(0, 40);
  }

  document.addEventListener('click', function (ev) {
    try {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var partner = partnerFor(a.href);
      if (!partner) return;
      var placement = placementOf(a);
      var slug = pageSlug();

      // GA4 event
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'affiliate_click', {
          partner: partner.name,
          placement: placement,
          page_slug: slug,
          transport_type: 'beacon'
        });
      }

      // Impact subId attribution (idempotent)
      if (partner.subid && a.href.indexOf('subId1=') === -1) {
        var sid = (slug + '--' + placement).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
        a.href += (a.href.indexOf('?') > -1 ? '&' : '?') + 'subId1=' + sid;
      }
    } catch (e) { /* link proceeds untouched */ }
  }, true);
})();
