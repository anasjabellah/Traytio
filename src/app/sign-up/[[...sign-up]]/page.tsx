import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthLayout, authAppearance } from "@/features/auth";

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
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp appearance={authAppearance} />
    </AuthLayout>
  );
}
