import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AUTH } from "@/lib/notify/messages";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte TUR et gérez votre activité de traiteur en toute simplicité.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/sign-up`,
  },
  openGraph: {
    title: "Créer un compte — TUR",
    description: "Créez votre compte TUR.",
    url: `${siteUrl}/sign-up`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Créer un compte — TUR",
    description: "Créez votre compte TUR.",
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-semibold">
            {AUTH.SIGN_UP.TITLE}
          </h1>
          <p className="text-muted-foreground">
            {AUTH.SIGN_UP.DESCRIPTION}
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
              card: "bg-card border border-border/40 shadow-sm",
            },
          }}
        />
      </div>
    </div>
  );
}
