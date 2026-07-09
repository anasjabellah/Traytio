"use client"

import * as React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { PAYMENT } from "@/lib/notify/messages";
import { deletePayment } from "@/features/payments/actions/delete-payment";
import { formatCurrency } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  amount: number;
  onSuccess: () => void;
}

export function DeletePaymentDialog({
  open,
  onOpenChange,
  paymentId,
  amount,
  onSuccess,
}: DeletePaymentDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await deletePayment(paymentId);
      if (resp.success) {
        notify.success(PAYMENT.DELETE.SUCCESS);
        onSuccess();
        onOpenChange(false);
      } else {
        notify.error(resp.error ?? PAYMENT.DELETE.ERROR);
      }
    } catch {
      notify.error(PAYMENT.DELETE.UNEXPECTED_ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-100 text-red-600">
            <Trash2 className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Supprimer le paiement</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer ce paiement de{" "}
            <strong>{formatCurrency(amount)}</strong>&nbsp;?
            <br />
            Cette action est irréversible. Les soldes seront recalculés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
