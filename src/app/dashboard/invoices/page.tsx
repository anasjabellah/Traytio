import { getInvoices } from '@/features/invoices/actions/invoice-actions';
import { getInvoiceStats } from '@/features/invoices/lib/get-invoice-stats';
import InvoicesPageClient from './invoices-page-client';

export default async function InvoicesPage() {
  const [invoicesResult, stats] = await Promise.all([
    getInvoices({ page: 1, limit: 10 }),
    getInvoiceStats(),
  ]);

  if (invoicesResult.success && invoicesResult.data) {
    return <InvoicesPageClient initialData={invoicesResult.data} stats={stats} />;
  }

  return <InvoicesPageClient stats={stats} />;
}
