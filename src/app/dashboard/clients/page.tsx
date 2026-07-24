import { getClientsPage } from '@/features/clients/actions/get-clients-page';
import { CLIENT_DEFAULT_PAGE_SIZE } from '@/features/clients/constants';
import { ClientsPageClient } from './clients-page-client';

export default async function ClientsPage() {
  const result = await getClientsPage({ limit: CLIENT_DEFAULT_PAGE_SIZE });

  if (result.success && result.data) {
    return <ClientsPageClient initialData={result.data} />;
  }

  return <ClientsPageClient />;
}