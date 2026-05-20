import type { Metadata } from "next";
import { Inter, Playfair_Display, Finlandica, Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import CustomCursor from "@/components/ui/custom-cursor";


const finlandica = Finlandica({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-finlandica",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
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
          className={` ${cormorant.variable} ${dmSans.variable} ${finlandica.variable} h-full antialiased`}
        >
          <body className={`min-h-full flex flex-col bg-background text-foreground `}>
            <CustomCursor />
            {children}
          </body>
        </html>
      </TooltipProvider>
    </ClerkProvider>
  );
}
