"use client"

import { TopBar } from "@/components/dashboard/top-bar"

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopBar />
      {children}
    </>
  )
}
