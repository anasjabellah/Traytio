// src/features/menu-items/components/delete-menu-item-dialog.tsx

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteMenuItem } from '@/features/menu-items/actions/delete-menu-item';
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
        toast.success('Article supprimé avec succès');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(resp.error || "Erreur lors de la suppression de l'article");
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur inattendue');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes‑vous sûr de vouloir supprimer l'article <strong>{item.name}</strong> ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
