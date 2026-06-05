"use client";

import { TopBar } from "@/components/dashboard/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar />
      {children}
    </>
  );
}