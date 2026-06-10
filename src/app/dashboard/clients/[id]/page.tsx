import { notFound } from "next/navigation";
import { getClientById } from "@/features/clients/actions/get-client-by-id";
import type { ClientWithStats } from "@/features/clients/types";
import ClientDetailView from "./client-detail-view";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getClientById(id);
  if (!response.success || !response.data) {
    notFound();
  }
  return <ClientDetailView client={response.data as ClientWithStats} />;
}
