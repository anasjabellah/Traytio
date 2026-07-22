import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AUTH } from "@/lib/notify/messages";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte TUR pour gérer votre activité de traiteur.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/sign-in`,
  },
  openGraph: {
    title: "Connexion — TUR",
    description: "Connectez-vous à votre compte TUR.",
    url: `${siteUrl}/sign-in`,
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-semibold">
            {AUTH.SIGN_IN.TITLE}
          </h1>
          <p className="text-muted-foreground">
            {AUTH.SIGN_IN.DESCRIPTION}
          </p>
        </div>
        <SignIn
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
