import { redirect } from "next/navigation";
import { getMenuById } from "@/features/menus/actions/get-menu-by-id";
import MenuDetailView from "./menus-detail-view";

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getMenuById(id);
  if (!response.success || !response.data) {
    redirect("/dashboard/menus");
  }
  return <MenuDetailView menu={response.data} />;
}
