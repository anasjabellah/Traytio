import * as React from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { deleteMenu } from '@/features/menus/actions/delete-menu';
import type { Menu } from '@/features/menus/types';
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
        toast.success('Menu supprimé avec succès');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(resp.error || "Erreur lors de la suppression du menu");
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
          <div className="mx-auto mb-2 size-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="size-6 text-red-600" />
          </div>
          <AlertDialogTitle>Supprimer le menu</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes‑vous sûr de vouloir supprimer le menu <strong>{menu.name}</strong> ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
