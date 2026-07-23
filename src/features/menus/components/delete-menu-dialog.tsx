'use client';

import * as React from 'react';
import { notify } from '@/lib/notify';
import { MENU } from '@/lib/notify/messages';
import { deleteMenu } from '@/features/menus/actions/delete-menu';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import type { Menu } from '@/features/menus/types';

type DeleteMenuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: Menu;
  onSuccess?: () => void;
};

export function DeleteMenuDialog({ open, onOpenChange, menu, onSuccess }: DeleteMenuDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await deleteMenu(menu.id);
      if (resp.success) {
        notify.success(MENU.DELETE.SUCCESS);
        onSuccess?.();
        onOpenChange(false);
      } else {
        notify.error(resp.error || MENU.DELETE.ERROR);
      }
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : MENU.UNEXPECTED_ERROR);
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
      title="Supprimer le menu"
      description={
        <>
          Êtes-vous sûr de vouloir supprimer le menu{' '}
          <span className="font-semibold text-foreground">{menu.name}</span> ?
        </>
      }
    />
  );
}
