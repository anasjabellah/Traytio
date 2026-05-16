import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TUR | Luxury Catering Management Platform",
  description:
    "Premium SaaS platform for traiteurs, catering businesses, pâtisseries, and event organizers. Replace WhatsApp chaos, paper management, and Excel sheets with a luxury modern experience.",
  keywords: [
    "catering",
    "traiteur",
    "event management",
    "luxury",
    "SaaS",
    "pâtisserie",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <TooltipProvider>
        <html
          lang="fr"
          className={`${inter.variable} ${playfair.variable} h-full antialiased`}
        >
          <body className="min-h-full flex flex-col bg-background text-foreground">
            {children}
          </body>
        </html>
      </TooltipProvider>
    </ClerkProvider>
  );
}
