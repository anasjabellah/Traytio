import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthLayout, authAppearance } from "@/features/auth";

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
  twitter: {
    card: "summary_large_image",
    title: "Connexion — TUR",
    description: "Connectez-vous à votre compte TUR.",
  },
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn appearance={authAppearance} />
    </AuthLayout>
  );
}
