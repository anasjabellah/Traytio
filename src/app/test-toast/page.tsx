import type { Metadata } from "next";
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
  return <TestToastClient />;
}
