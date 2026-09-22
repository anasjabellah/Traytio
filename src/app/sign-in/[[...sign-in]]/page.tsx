import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/features/auth";
import { SignInView } from "@/features/auth/components/signin-view";

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
    <SignInView>
      <SignIn
        appearance={{
          ...authAppearance,
          elements: {
            ...authAppearance.elements,
            // Chromeless inside our own auth container (sign-in only —
            // the shared theme keeps its card for other auth surfaces).
            card: {
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
              padding: "0",
            },
            // Single visible title: ours above. Clerk's native header is
            // hidden on sign-in only — sub-flow fields/buttons are untouched.
            headerTitle: { display: "none" },
            headerSubtitle: { display: "none" },
            // The hidden header container keeps its theme marginBottom —
            // neutralize it so no dead space sits between our subtitle
            // and the first field. Headings in sub-flows still render.
            header: { marginBottom: "0" },
            // No public self-registration: hide the entire
            // "Vous n'avez pas encore de compte ? S'inscrire" row.
            // Forgot-password (formFieldAction) is untouched.
            footerAction: { display: "none" },
          },
        }}
      />
    </SignInView>
  );
}
