import { notFound } from "next/navigation";
import { getCommandeById } from "@/features/commandes/actions/get-commande-by-id";
import type { CommandeWithDetails } from "@/features/commandes/types";
import CommandeDetailView from "./commande-detail-view";

export default async function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getCommandeById(id);
  if (!response.success || !response.data) {
    notFound();
  }
  return <CommandeDetailView commande={response.data as CommandeWithDetails} />;
}
