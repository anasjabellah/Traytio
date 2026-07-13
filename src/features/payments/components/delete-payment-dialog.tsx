"use client"

import * as React from "react";
import { notify } from "@/lib/notify";
import { PAYMENT } from "@/lib/notify/messages";
import { deletePayment } from "@/features/payments/actions/delete-payment";
import { formatCurrency } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

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
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      loading={isDeleting}
      title="Supprimer le paiement"
      description={
        <>
          Êtes-vous sûr de vouloir supprimer ce paiement de{' '}
          <span className="font-semibold text-foreground">{formatCurrency(amount)}</span> ?
          <br />
          Les soldes seront recalculés.
        </>
      }
    />
  );
}
