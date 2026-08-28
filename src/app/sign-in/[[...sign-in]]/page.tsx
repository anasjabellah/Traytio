import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthLayout, authAppearance } from "@/features/auth";
import { Navbar } from "@/components/site/Navbar";

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
};

export default function SignInPage() {
  return (
    <AuthLayout topbar={<Navbar />}>
      <SignIn appearance={authAppearance} />
    </AuthLayout>
  );
}
