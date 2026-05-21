import { redirect } from "next/navigation";
import { getClientById } from "@/features/clients/actions/get-client-by-id";
import ClientDetailView from "./client-detail-view";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const response = await getClientById(params.id);
  if (!response.success || !response.data) {
    redirect("/dashboard/clients");
  }
  return <ClientDetailView client={response.data} />;
}
