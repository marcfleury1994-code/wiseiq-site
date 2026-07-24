/**
 * WiseIQ Affiliate Links — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────
 * HOW TO UPDATE WHEN FLEXOFFERS IS APPROVED:
 * 1. Log into FlexOffers → Publishers → Links
 * 2. Find each advertiser and copy your unique tracking URL
 * 3. Replace the placeholder URLs below with your real FlexOffers tracking URLs
 * 4. Save this file — every button on the entire site updates automatically
 *
 * FORMAT: "OFFER_ID": "https://track.flexoffers.com/a/d/YOUR_PUBLISHER_ID/..."
 */

const AFFILIATE_LINKS = {

  // ── CREDIT CARDS ──────────────────────────────────────────────
  chase_sapphire_preferred:     "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",   // ~$100–$200/approval
  chase_sapphire_reserve:       "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
  chase_freedom_unlimited:      "https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited",
  discover_it_cash_back:        "https://www.discover.com/credit-cards/cash-back/it-card.html",
  discover_it_student:          "https://www.discover.com/credit-cards/student/it-card.html",
  capital_one_venture_x:        "https://www.capitalone.com/credit-cards/venture-x/",
  capital_one_quicksilver:      "https://www.capitalone.com/credit-cards/quicksilver/",
  capital_one_secured:          "https://www.capitalone.com/credit-cards/secured/",
  citi_double_cash:             "https://www.citi.com/credit-cards/citi-double-cash-credit-card",
  citi_custom_cash:             "https://www.citi.com/credit-cards/citi-custom-cash-card",
  amex_gold:                    "https://www.americanexpress.com/us/credit-cards/card/gold-card/",
  amex_blue_cash_preferred:     "https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/",
  wells_fargo_active_cash:      "https://creditcards.wellsfargo.com/active-cash-credit-card/",
  bank_of_america_premium:      "https://www.bankofamerica.com/credit-cards/products/travel-rewards-credit-card/",
  us_bank_altitude_go:          "https://www.usbank.com/credit-cards/altitude-go-visa-signature-credit-card.html",

  // ── PERSONAL LOANS ────────────────────────────────────────────
  sofi_personal_loan:           "https://www.sofi.com/personal-loans/",                                    // ~$30–$80/lead
  lightstream_loan:             "https://www.lightstream.com/",
  marcus_personal_loan:         "https://www.marcus.com/us/en/personal-loans",
  upgrade_personal_loan:        "https://www.upgrade.com/personal-loans/",
  upstart_personal_loan:        "https://upstart.9c65.net/9VW6GY",
  lending_club:                 "https://www.lendingclub.com/personal-loan",
  best_egg_loan:                "https://www.bestegg.com/",
  prosper_loan:                 "https://www.prosper.com/personal-loans",
  avant_loan:                   "https://www.avant.com/",
  oneMain_financial:            "https://www.onemainfinancial.com/",

  // ── HIGH-YIELD SAVINGS ────────────────────────────────────────
  marcus_savings:               "https://www.marcus.com/us/en/savings/high-yield-savings",                 // ~$30–$100/open
  ally_savings:                 "https://www.ally.com/bank/online-savings-account/",
  sofi_savings:                 "https://www.sofi.com/banking/savings/",
  discover_savings:             "https://www.discover.com/online-banking/savings-account/",
  american_express_savings:     "https://www.americanexpress.com/en-us/banking/online-savings/",
  cit_bank_savings:             "https://www.cit.com/cit-bank/banking/savings/",
  synchrony_savings:            "https://www.synchronybank.com/banking/high-yield-savings/",
  capital_one_360:              "https://www.capitalone.com/bank/savings-accounts/online-savings-account/",

  // ── INVESTING ─────────────────────────────────────────────────
  betterment:                   "https://www.betterment.com/",                                             // ~$50–$150/funded account
  wealthfront:                  "https://www.wealthfront.com/",
  robinhood:                    "https://robinhood.com/",
  acorns:                       "https://www.acorns.com/",
  stash:                        "https://www.stash.com/",
  m1_finance:                   "https://m1.com/",
  public_investing:             "https://public.com/",
  sofi_invest:                  "https://www.sofi.com/invest/",

  // ── STUDENT LOANS ────────────────────────────────────────────
  sofi_student_refi:            "https://www.sofi.com/refinance-student-loan/",                           // ~$50–$150/funded
  earnest_student_refi:         "https://www.earnest.com/student-loan-refinancing",
  splash_financial:             "https://www.splashfinancial.com/",
  college_ave:                  "https://www.collegeavestudentloans.com/",
  sallie_mae:                   "https://www.salliemae.com/student-loans/",
  discover_student_loan:        "https://www.discover.com/student-loans/",
  navient_refi:                 "https://www.navient.com/",
  commonbond:                   "https://commonbond.co/",

  // ── BUSINESS CREDIT CARDS ────────────────────────────────────
  ink_business_preferred:       "https://creditcards.chase.com/business-credit-cards/ink/preferred",      // ~$100–$200/approval
  amex_business_gold:           "https://www.americanexpress.com/us/credit-cards/card/american-express-business-gold-card/",
  capital_one_spark_cash:       "https://www.capitalone.com/small-business/credit-cards/spark-cash-plus/",
  amex_blue_business_cash:      "https://www.americanexpress.com/us/credit-cards/card/blue-business-cash-card/",
  ink_business_cash:            "https://creditcards.chase.com/business-credit-cards/ink/cash",
  us_bank_business_leverage:    "https://www.usbank.com/business-banking/business-credit-cards/business-leverage-visa-signature-card.html",
  brex_business:                "https://www.brex.com/product/credit-card",
  ramp_business:                "https://ramp.com/",

  // ── MORTGAGES ─────────────────────────────────────────────────
  rocket_mortgage:              "https://www.rocketmortgage.com/",                                         // ~$50–$150/lead
  better_mortgage:              "https://better.com/",
  lendingTree_mortgage:         "https://www.lendingtree.com/home/mortgage/",
  bankrate_mortgage:            "https://www.bankrate.com/mortgages/",

  // ── AUTO LOANS ────────────────────────────────────────────────
  autopay_auto:                 "https://www.autopay.com/",                                                // ~$20–$60/lead
  lendingTree_auto:             "https://www.lendingtree.com/auto/",
  capital_one_auto:             "https://www.capitalone.com/cars/",

  // ── INSURANCE ─────────────────────────────────────────────────
  lemonade_renters:             "https://www.lemonade.com/renters",                                        // ~$10–$40/lead
  policygenius:                 "https://www.policygenius.com/",
  progressive_auto:             "https://www.progressive.com/",

  // ── DEBT RELIEF ───────────────────────────────────────────────
  national_debt_relief:         "https://www.nationaldebtrelief.com/",                                     // ~$30–$80/lead
  freedom_debt_relief:          "https://www.freedomdebtrelief.com/",
  accredited_debt_relief:       "https://www.accrediteddebtrelief.com/",
  creditAssociates:             "https://www.creditassociates.com/",
  curadebt:                     "https://www.curadebt.com/",
  beyond_finance:               "https://www.beyondfinance.com/",

  // ── CHECKING ACCOUNTS ─────────────────────────────────────────
  chime_checking:               "https://www.chime.com/open-a-bank-account/",                             // ~$10–$30/signup
  sofi_checking:                "https://www.sofi.com/banking/checking-and-savings/",
  ally_checking:                "https://www.ally.com/bank/interest-checking-account/",
  discover_checking:            "https://www.discover.com/online-banking/checking/",
  capital_one_360_checking:     "https://www.capitalone.com/bank/checking-accounts/online-checking-account/",
  axos_checking:                "https://www.axosbank.com/Personal/Checking",
  current_checking:             "https://current.com/",
  varo_checking:                "https://www.varomoney.com/",
  one_finance:                  "https://www.one.app/",

  // ── CREDIT BUILDING ───────────────────────────────────────────
  self_credit_builder:          "https://www.self.inc/",                                                   // ~$20–$50/signup
  credit_strong:                "https://www.creditstrong.com/",
  chime_credit_builder:         "https://www.chime.com/credit-builder-visa-credit-card/",
  secured_opensky:              "https://www.openskycc.com/",
  credit_karma:                 "https://www.creditkarma.com/",
};

/**
 * Track a click and redirect to the affiliate URL
 * @param {string} offerId - Key from AFFILIATE_LINKS
 * @param {string} offerName - Human-readable name for analytics
 */
function applyNow(offerId, offerName) {
  const url = AFFILIATE_LINKS[offerId];
  if (!url) { console.warn('Missing affiliate link for:', offerId); return; }
  // Analytics event (add your GA4 or Plausible event here)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'affiliate_click', { offer_id: offerId, offer_name: offerName });
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
