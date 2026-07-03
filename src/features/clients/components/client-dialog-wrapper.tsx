import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type ClientDialogWrapperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function ClientDialogWrapper({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ClientDialogWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col p-0 gap-0 w-[calc(100vw-2rem)] sm:max-w-[600px] md:max-w-[800px] rounded-xl border border-[#e2e2e2] shadow-lg overflow-hidden max-h-[85vh]">
        {/* FIXED HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e2e2e2] shrink-0">
          <DialogTitle className="font-heading text-2xl font-medium text-[#1a1a1a]">{title}</DialogTitle>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-2 mb-1" />
          <DialogDescription className="text-sm text-[#888888]">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5">
          {children}
        </div>

        {/* FIXED FOOTER */}
        <div className="px-6 py-4 border-t border-[#e2e2e2] flex items-center justify-end gap-3 shrink-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}
