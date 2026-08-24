import type { Metadata } from "next";
import { canonicalMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...canonicalMetadata("/faq"), title: "FAQ" };

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
