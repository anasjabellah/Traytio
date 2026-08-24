import type { Metadata } from "next";
import { canonicalMetadata } from "@/lib/seo";

export const metadata: Metadata = canonicalMetadata("/temoignages");

export default function TemoignagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
