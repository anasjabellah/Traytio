import { TopBar } from "@/components/dashboard/top-bar"
import { ScrollToTop } from "@/components/scroll-to-top"

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ScrollToTop />
      <TopBar />
      {children}
    </>
  )
}
