import { notFound } from "next/navigation"
import { getInvoiceById } from "@/features/invoices/actions/invoice-actions"
import InvoiceDetailView from "./invoice-detail-view"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await getInvoiceById(id)
  if (!response.success || !response.data) {
    notFound()
  }
  return <InvoiceDetailView invoice={response.data} />
}
