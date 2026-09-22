import type { ReactNode } from "react";
import { AuthCard } from "./auth-card";
import { AuthTopbar } from "./auth-topbar";
import { BrandPanel } from "./brand-panel";

export function AuthLayout({
  children,
  topbar,
  layout = "split",
}: {
  children: React.ReactNode;
  topbar?: ReactNode;
  /** "split" keeps the marketing BrandPanel; "centered" renders a dedicated
      centered authentication experience without it. */
  layout?: "split" | "centered";
}) {
  if (layout === "centered") {
    return (
      <div className="relative min-h-svh bg-background">
        {topbar ?? <AuthTopbar />}
        <div className="grid min-h-svh grid-cols-1">
          <AuthCard centered>{children}</AuthCard>
        </div>
      </div>
    );
  }
  return (
    <div className="relative min-h-svh bg-background">
      {topbar ?? <AuthTopbar />}
      <div className="grid min-h-svh md:grid-cols-[1.05fr_1fr] lg:grid-cols-[1.2fr_1fr]">
        <BrandPanel />
        <AuthCard>{children}</AuthCard>
      </div>
    </div>
  );
}
