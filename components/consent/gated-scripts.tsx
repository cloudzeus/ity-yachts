"use client"

import Script from "next/script"
import { useConsent } from "./consent-provider"

/**
 * Analytics and advertising tags, loaded only after the visitor agrees.
 *
 * The point of a consent banner is that nothing here reaches the page before a
 * choice is made — so these are rendered conditionally rather than loaded and
 * then told to behave. Withdrawing consent unmounts them, and the provider
 * clears the cookies they set.
 *
 * IDs come from settings, so adding a tag is a form field rather than a deploy.
 */
export function GatedScripts({
  gaId, metaPixelId,
}: {
  gaId?: string | null
  metaPixelId?: string | null
}) {
  const { allows, ready } = useConsent()

  if (!ready) return null

  return (
    <>
      {gaId && allows("analytics") && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              /* No advertising signals from the analytics tag: that is what the
                 advertising category is for, and it is a separate decision. */
              gtag('config', '${gaId}', { anonymize_ip: true, allow_google_signals: false });
            `}
          </Script>
        </>
      )}

      {metaPixelId && allows("marketing") && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}
