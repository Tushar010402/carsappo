"use client";

type Item = { item_id: string; item_name: string; price: number; quantity?: number; item_category?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    __carsappoAds?: { id: string; purchaseLabel: string };
  }
}

const PIXEL_EVENTS: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
  generate_lead: "Lead",
  sign_up: "CompleteRegistration",
};

/**
 * Sends an ecommerce event to GTM (dataLayer), GA4 (gtag), Meta Pixel and Google Ads.
 * Amounts are passed in paise and converted to rupees here.
 */
export function track(
  event: keyof typeof PIXEL_EVENTS,
  data: { value?: number; items?: Item[]; transactionId?: string; searchTerm?: string; extra?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  const value = data.value !== undefined ? data.value / 100 : undefined;
  const items = data.items?.map((i) => ({ ...i, price: i.price / 100 }));
  const ecommerce = { currency: "INR", value, items, transaction_id: data.transactionId, ...(data.extra ?? {}) };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce, search_term: data.searchTerm });

  window.gtag?.("event", event, { ...ecommerce, search_term: data.searchTerm });

  const pixelEvent = PIXEL_EVENTS[event];
  if (pixelEvent && window.fbq) {
    window.fbq("track", pixelEvent, {
      value,
      currency: "INR",
      content_ids: items?.map((i) => i.item_id),
      content_type: "product",
      search_string: data.searchTerm,
    });
  }

  if (event === "purchase" && window.gtag && window.__carsappoAds?.id && window.__carsappoAds.purchaseLabel) {
    window.gtag("event", "conversion", {
      send_to: `${window.__carsappoAds.id}/${window.__carsappoAds.purchaseLabel}`,
      value,
      currency: "INR",
      transaction_id: data.transactionId,
    });
  }
}
