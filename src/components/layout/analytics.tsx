import Script from "next/script";
import type { Settings } from "@/lib/settings";

const ok = (v: string, re: RegExp) => (re.test(v) ? v : "");

/** GA4, Google Tag Manager, Google Ads and Meta Pixel — IDs are managed in Admin → SEO & Tracking. */
export function Analytics({ tracking }: { tracking: Settings["tracking"] }) {
  const ga4 = ok(tracking.ga4Id.trim(), /^G-[A-Z0-9]{4,}$/);
  const gtm = ok(tracking.gtmId.trim(), /^GTM-[A-Z0-9]{4,}$/);
  const pixel = ok(tracking.metaPixelId.trim(), /^\d{6,20}$/);
  const ads = ok(tracking.googleAdsId.trim(), /^AW-\d{6,}$/);
  const adsLabel = ok(tracking.googleAdsPurchaseLabel.trim(), /^[\w-]{4,}$/);
  const gtagId = ga4 || ads;

  return (
    <>
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
      {gtagId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${ga4 ? `gtag('config','${ga4}');` : ""}${ads ? `gtag('config','${ads}');window.__carsappoAds={id:'${ads}',purchaseLabel:'${adsLabel}'};` : ""}`}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
      {gtm && (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="gtm" />
        </noscript>
      )}
    </>
  );
}
