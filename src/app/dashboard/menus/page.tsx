import { getMenus } from '@/features/menus/actions/get-menus';
import { MENU_DEFAULT_PAGE_SIZE } from '@/features/menus/constants';
import { MenusPageClient } from './menus-page-client';

export default async function MenusPage() {
  const result = await getMenus({ limit: MENU_DEFAULT_PAGE_SIZE });

  if (result.success && result.data) {
    return <MenusPageClient initialData={result.data} />;
  }

  return <MenusPageClient />;
}