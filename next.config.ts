import type { NextConfig } from "next";

const clerkFrontendHost = process.env.NEXT_PUBLIC_CLERK_FRONTEND_HOST ?? "*.clerk.accounts.dev";
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is removed in production: no production dependency requires it
  // (Next.js prod build, Clerk, GSAP, Framer Motion and Recharts do not use eval/new Function).
  // It is kept only in development so Next.js Fast Refresh keeps working.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://${clerkFrontendHost} https://clerk.${clerkFrontendHost.replace(/^\*\./, "")}`,
  // 'unsafe-inline' is retained in style-src: the app relies on React inline style attributes
  // (style={{ ... }}) pervasively (progress bars, table column widths, chart hover, PDF preview).
  // Removing it would require migrating all dynamic inline styles to CSS classes / custom properties,
  // which is a larger refactor out of scope for this targeted hardening.
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://${clerkFrontendHost}`,
  `font-src 'self' https://fonts.gstatic.com https://${clerkFrontendHost}`,
  `img-src 'self' data: blob: https://${clerkFrontendHost} https://res.cloudinary.com${cloudinaryCloudName ? `/${cloudinaryCloudName}` : ""} https://raw.githubusercontent.com`,
  `connect-src 'self' https://${clerkFrontendHost} https://api.clerk.com https://res.cloudinary.com`,
  `frame-src 'self' https://${clerkFrontendHost} https://clerk.${clerkFrontendHost.replace(/^\*\./, "")}`,
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  // Cross-Origin-Opener-Policy: same-origin isolates this browsing context from
  // cross-origin windows (defense against tab-nabbing / XS-leaks via window.opener).
  // Safe with Clerk: the hosted sign-in is rendered in an iframe and uses postMessage,
  // which is unaffected by COOP (it only governs window.opener, not iframes).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Cross-Origin-Resource-Policy: same-origin prevents other origins from embedding
  // our subresources. The app is not designed to be embedded cross-origin.
  // Does NOT affect our page loading cross-origin resources (e.g. Cloudinary images),
  // which are governed by those origins' own CORP headers.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
