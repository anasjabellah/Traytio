import type { Metadata } from "next";
import { canonicalMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...canonicalMetadata("/demo"), title: "Demande de démo" };

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
