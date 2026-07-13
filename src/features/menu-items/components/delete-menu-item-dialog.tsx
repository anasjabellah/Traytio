'use client';

import * as React from 'react';
import { notify } from '@/lib/notify';
import { MENU_ITEM } from '@/lib/notify/messages';
import { deleteMenuItem } from '@/features/menu-items/actions/delete-menu-item';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import type { MenuItem } from '@/features/menu-items/types';

type DeleteMenuItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  onSuccess?: () => void;
};

export function DeleteMenuItemDialog({ open, onOpenChange, item, onSuccess }: DeleteMenuItemDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await deleteMenuItem(item.id);
      if (resp.success) {
        notify.success(MENU_ITEM.DELETE.SUCCESS);
        onSuccess?.();
        onOpenChange(false);
      } else {
        notify.error(resp.error || MENU_ITEM.DELETE.ERROR);
      }
    } catch (e: any) {
      notify.error(e.message ?? MENU_ITEM.UNEXPECTED_ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      loading={isDeleting}
      title="Supprimer l'article"
      description={
        <>
          Êtes-vous sûr de vouloir supprimer l'article{' '}
          <span className="font-semibold text-foreground">{item.name}</span> ?
        </>
      }
    />
  );
}
