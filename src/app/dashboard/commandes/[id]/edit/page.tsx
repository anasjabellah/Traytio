import { notFound } from "next/navigation";
import { getCommandeById } from "@/features/commandes/actions/get-commande-by-id";
import type { CommandeWithDetails } from "@/features/commandes/types";
import CommandeEditView from "./commande-edit-view";

export default async function CommandeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("edit page id:", id);
  const response = await getCommandeById(id);
  console.log("edit page response:", JSON.stringify(response, null, 2));
  if (response.data?.attachments) {
    for (const a of response.data.attachments) {
      console.log("attachment:", { id: a.id, name: a.name, type: a.type, url: a.url });
    }
  }
  if (!response.success || !response.data) {
    console.error("Edit page 404 — response:", response);
    notFound();
  }
  return <CommandeEditView commande={response.data as CommandeWithDetails} />;
}
