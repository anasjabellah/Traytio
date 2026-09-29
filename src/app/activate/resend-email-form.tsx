'use client';

import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { resendActivationEmail } from '@/features/billing/actions/resend-activation';

/**
 * Manual recovery affordance: re-sends the activation email for a valid,
 * unconsumed purchase claim. Token-bearer authorized server-side; nothing
 * sensitive ever leaves the server except the generic result message.
 */
export function ResendEmailForm({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onResend() {
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    try {
      const res = await resendActivationEmail({ token });
      if (res.success) {
        setState('sent');
        setMessage('Email renvoyé. Vérifiez votre boîte de réception.');
      } else {
        setState('error');
        setMessage(res.error ?? "Envoi impossible pour le moment.");
      }
    } catch {
      setState('error');
      setMessage("Envoi impossible pour le moment.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onResend}
        disabled={state === 'sending' || state === 'sent'}
        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'sending' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MailCheck className="size-4" />
        )}
        {state === 'sent' ? 'Email envoyé' : state === 'sending' ? 'Envoi…' : "Renvoyer l'email"}
      </button>
      {message && (
        <p role={state === 'error' ? 'alert' : 'status'} className="text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
