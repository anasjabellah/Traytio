// src/app/dashboard/menu-items/[id]/page.tsx

import { redirect } from "next/navigation";
import { getMenuItemById } from "@/features/menu-items/actions/get-menu-item-by-id";
import MenuItemDetailView from "./menu-item-detail-view";

export default async function MenuItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getMenuItemById(id);
  if (!response.success || !response.data) {
    redirect("/dashboard/menu-items");
  }
  return <MenuItemDetailView item={response.data} />;
}
