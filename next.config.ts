import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "*.bunnycdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ws.nausys.com",
      },
      {
        protocol: "https",
        hostname: "cdn.weatherapi.com",
      },
    ],
  },

  /**
   * Security headers, on every response.
   *
   * The site sent none of these. They cost nothing to serve and they are the
   * cheapest issues on any audit to close — but more to the point, without
   * them a browser has no instruction to keep the site on HTTPS, to refuse
   * being framed, or to stop guessing at content types.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      /* Next hydration inlines its payload, and the consent-gated tags are
         injected at runtime — both need 'unsafe-inline'. 'unsafe-eval' is not
         granted. */
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://connect.facebook.net https://maps.googleapis.com",
      "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ")

    return [
      {
        source: "/:path*",
        headers: [
          // Two years, subdomains included — the value a preload list wants.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here needs a camera, a microphone or a location.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
