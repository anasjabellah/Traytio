import { getPayments } from '@/features/payments/actions/get-payments';
import { PAYMENT_DEFAULT_PAGE_SIZE } from '@/features/payments/constants';
import { PaymentsPageClient } from './payments-page-client';

export default async function PaymentsPage() {
  const result = await getPayments({ limit: PAYMENT_DEFAULT_PAGE_SIZE });

  if (result.success && result.data) {
    return <PaymentsPageClient initialData={result.data} />;
  }

  return <PaymentsPageClient />;
}
