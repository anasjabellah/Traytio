import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TUR — Le système d'exploitation des traiteurs modernes",
    template: "%s | TUR",
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
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "TUR",
    title: "TUR — Le système d'exploitation des traiteurs modernes",
    description:
      "Plateforme SaaS premium pour traiteurs et catering. Remplacez WhatsApp, Excel et papier par une suite élégante et puissante.",
    url: siteUrl,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "TUR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TUR — Le système d'exploitation des traiteurs modernes",
    description:
      "Plateforme SaaS premium pour traiteurs et catering. Remplacez WhatsApp, Excel et papier par une suite élégante et puissante.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="fr">
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