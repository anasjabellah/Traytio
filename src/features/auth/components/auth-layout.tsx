import type { ReactNode } from "react";
import { AuthCard } from "./auth-card";
import { AuthTopbar } from "./auth-topbar";
import { BrandPanel } from "./brand-panel";

export function AuthLayout({
  children,
  topbar,
}: {
  children: React.ReactNode;
  topbar?: ReactNode;
}) {
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
