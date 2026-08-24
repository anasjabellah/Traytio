import type { Metadata } from "next";
import { canonicalMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...canonicalMetadata("/contact"), title: "Contact" };

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
