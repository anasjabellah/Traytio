import { getMenuItems } from '@/features/menu-items/actions/get-menu-items';
import { MENU_ITEM_DEFAULT_PAGE_SIZE } from '@/features/menu-items/constants';
import { MenuItemsPageClient } from './menu-items-page-client';

export default async function MenuItemsPage() {
  const result = await getMenuItems({ limit: MENU_ITEM_DEFAULT_PAGE_SIZE });

  if (result.success && result.data) {
    return <MenuItemsPageClient initialData={result.data} />;
  }

  return <MenuItemsPageClient />;
}
