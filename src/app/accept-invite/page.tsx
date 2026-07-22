import type { Metadata } from "next"
import { AcceptInviteClient } from "./accept-invite-client"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Accepter l'invitation",
  description: "Acceptez votre invitation à rejoindre une organisation sur TUR.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/accept-invite`,
  },
};

export default function AcceptInvitePage() {
  return <AcceptInviteClient />;
}
