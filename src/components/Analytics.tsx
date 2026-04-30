import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GADS_IDS = (process.env.NEXT_PUBLIC_GOOGLE_ADS_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const PRIMARY_TAG_ID = GA_ID || GADS_IDS[0];

export default function Analytics() {
  if (!PRIMARY_TAG_ID) return null;

  const configCalls = [
    GA_ID ? `gtag('config', '${GA_ID}', { anonymize_ip: true });` : "",
    ...GADS_IDS.map((id) => `gtag('config', '${id}');`),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <Script
        id="consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            var hasConsent = false;
            try { hasConsent = localStorage.getItem('cookie_consent') === 'accepted'; } catch (e) {}
            gtag('consent', 'default', {
              ad_storage:           hasConsent ? 'granted' : 'denied',
              ad_user_data:         hasConsent ? 'granted' : 'denied',
              ad_personalization:   hasConsent ? 'granted' : 'denied',
              analytics_storage:    hasConsent ? 'granted' : 'denied',
              functionality_storage:'granted',
              security_storage:     'granted',
              wait_for_update:      500
            });
            gtag('js', new Date());
            window.updateConsent = function(granted) {
              gtag('consent', 'update', {
                ad_storage:         granted ? 'granted' : 'denied',
                ad_user_data:       granted ? 'granted' : 'denied',
                ad_personalization: granted ? 'granted' : 'denied',
                analytics_storage:  granted ? 'granted' : 'denied',
              });
            };
          `,
        }}
      />
      <Script
        id="gtag-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${PRIMARY_TAG_ID}`}
      />
      <Script
        id="gtag-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: configCalls }}
      />
    </>
  );
}
