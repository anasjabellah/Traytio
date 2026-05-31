import { redirect } from "next/navigation";
import { getClientById } from "@/features/clients/actions/get-client-by-id";
import ClientDetailView from "./client-detail-view";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getClientById(id);
  if (!response.success || !response.data) {
    redirect("/dashboard/clients");
  }
  return <ClientDetailView client={response.data} />;
}
