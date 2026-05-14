window.adforgeTrack = function adforgeTrack(eventName, params = {}) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, {
    page_path: window.location.pathname,
    ...params
  });
};

document.addEventListener("click", (event) => {
  const lineLink = event.target.closest('a[href*="page.line.me/ndb3949k"], a[href*="line.me"], a[href^="line://"]');
  if (!lineLink) return;

  window.adforgeTrack("click_line_cta", {
    link_url: lineLink.href,
    link_text: lineLink.textContent.trim().slice(0, 80)
  });
});

const pricingSection = document.querySelector("#pricing");
if (pricingSection && "IntersectionObserver" in window) {
  let hasTrackedPricing = false;
  const pricingObserver = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible || hasTrackedPricing) return;

      hasTrackedPricing = true;
      window.adforgeTrack("view_pricing");
      pricingObserver.disconnect();
    },
    { threshold: 0.35 }
  );

  pricingObserver.observe(pricingSection);
} else if (pricingSection && window.location.hash === "#pricing") {
  window.adforgeTrack("view_pricing");
}
