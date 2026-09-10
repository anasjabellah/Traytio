import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TestToastClient from "./test-toast-client";

export const metadata: Metadata = {
  title: "Test — Notifications",
  description: "Page de test pour le système de notifications de TUR.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestToastPage() {
  // Dev-only page: never serve it outside of a development server.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <TestToastClient />;
}
