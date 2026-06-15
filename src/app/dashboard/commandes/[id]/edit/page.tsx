import { notFound } from "next/navigation";
import { getCommandeById } from "@/features/commandes/actions/get-commande-by-id";
import type { CommandeWithDetails } from "@/features/commandes/types";
import CommandeEditView from "./commande-edit-view";

export default async function CommandeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getCommandeById(id);
  if (!response.success || !response.data) {
    notFound();
  }
  return <CommandeEditView commande={response.data as CommandeWithDetails} />;
}
