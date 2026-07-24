import { getCommandesPage } from '@/features/commandes/actions/get-commandes-page';
import { COMMANDE_DEFAULT_PAGE_SIZE } from '@/features/commandes/constants';
import { CommandesPageClient } from './commandes-page-client';

export default async function CommandesPage() {
  const result = await getCommandesPage({ limit: COMMANDE_DEFAULT_PAGE_SIZE });

  if (result.success && result.data) {
    return <CommandesPageClient initialData={result.data} />;
  }

  return <CommandesPageClient />;
}