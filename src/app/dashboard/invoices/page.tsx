import { getInvoices } from '@/features/invoices/actions/invoice-actions';
import InvoicesPageClient from './invoices-page-client';

export default async function InvoicesPage() {
  const result = await getInvoices({ page: 1, limit: 10 });

  if (result.success && result.data) {
    return <InvoicesPageClient initialData={result.data} />;
  }

  return <InvoicesPageClient />;
}
