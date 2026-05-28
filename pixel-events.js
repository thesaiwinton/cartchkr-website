// CartChkr — Meta Pixel event handlers.
// Loaded on every page. Base pixel + PageView fire from inline <head> snippets;
// this file adds the user-interaction events (clicks + scroll depth).
//
// Events fired:
//   Lead              - click on any "Install" CTA pointing at chromewebstore.google.com
//   InitiateCheckout  - click on a paid plan CTA (data-plan="founding"|"lifetime"|"monthly").
//                       Also still fires Lead so we keep a unified install-intent funnel.
//   ViewContent       - only on faq.html (fired from the inline head snippet there).
//   Scroll50, Scroll90 - once each per page, custom events for engagement segmentation.
//
// Defensive: bails silently if fbq isn't loaded (e.g. if an ad blocker stripped
// the base pixel - we don't want to throw and break the page).

(function () {
  if (typeof window === 'undefined') return;
  var fire = function (event, params) {
    try {
      if (typeof window.fbq === 'function') {
        if (params) { window.fbq('track', event, params); }
        else { window.fbq('track', event); }
      }
    } catch (_) { /* swallow */ }
  };

  // 1) CTA click tracking
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var plan = a.getAttribute('data-plan');

    if (plan) {
      var planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
      var planValue = plan === 'founding' ? 0.99 : plan === 'lifetime' ? 3.99 : plan === 'monthly' ? 2.99 : 0;
      fire('InitiateCheckout', {
        content_name: 'CartChkr ' + planLabel,
        content_category: 'extension_plan',
        content_ids: [plan],
        currency: 'AUD',
        value: planValue
      });
      fire('Lead', {
        content_name: 'CWS Install Click (' + plan + ')',
        content_category: 'extension_install'
      });
    } else if (href.indexOf('chromewebstore.google.com') !== -1) {
      fire('Lead', {
        content_name: 'CWS Install Click',
        content_category: 'extension_install'
      });
    }
  }, true);

  // 2) Scroll depth (once per milestone per page)
  var hit50 = false, hit90 = false;
  var onScroll = function () {
    var doc = document.documentElement;
    var scrolled = (window.scrollY + window.innerHeight) / (doc.scrollHeight || 1);
    var pct = scrolled * 100;
    if (!hit50 && pct >= 50) { hit50 = true; fire('Scroll50'); }
    if (!hit90 && pct >= 90) { hit90 = true; fire('Scroll90'); }
  };
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
})();
