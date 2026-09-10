import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TUR — Le système d'exploitation des traiteurs modernes",
    template: "%s | Traytio",
  },
  description:
    "Plateforme SaaS premium pour traiteurs et catering : clients, devis, commandes, événements et paiements dans une seule interface.",
  keywords: [
    "traiteur",
    "catering",
    "logiciel traiteur",
    "gestion traiteur",
    "devis traiteur",
    "facture traiteur",
    "SaaS traiteur",
    "TUR",
    "plateforme traiteur",
  ],
  authors: [{ name: "TUR" }],
  creator: "TUR",
  publisher: "TUR",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Traytio",
    url: siteUrl,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Traytio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={frFR}>
      <html
        lang="fr"
        className={manrope.variable}
      >
        <body>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}