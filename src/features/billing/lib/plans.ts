// ---------------------------------------------------------------------------
// Server-side SaaS plan catalog — the ONLY source of plan pricing.
// The checkout page and all future billing phases resolve plans through
// resolvePlan(). Browser input (query string, body) can only ever carry a
// plan identifier — amounts, currency, and intervals are never accepted
// from the client. ENTERPRISE is intentionally absent: not purchasable yet.
// ---------------------------------------------------------------------------

export const PURCHASABLE_PLANS = ['STARTER', 'PROFESSIONAL'] as const;

export type PurchasablePlan = (typeof PURCHASABLE_PLANS)[number];

export type PlanDetails = {
  id: PurchasablePlan;
  name: string;
  tagline: string;
  priceMad: number;
  currency: 'MAD';
  interval: 'month';
  intervalLabel: string;
  features: string[];
};

export const BILLING_PLANS: Record<PurchasablePlan, PlanDetails> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'Fonctionnalités essentielles pour démarrer votre activité.',
    priceMad: 299,
    currency: 'MAD',
    interval: 'month',
    intervalLabel: '/mois',
    features: [
      "Jusqu'à 30 événements / mois",
      'Gestion des clients',
      'Devis & factures illimités',
      'Calendrier des événements',
      'Tableau de bord',
      'Support par e-mail',
    ],
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'Professionnel',
    tagline: 'Pour les traiteurs qui souhaitent développer leur activité.',
    priceMad: 599,
    currency: 'MAD',
    interval: 'month',
    intervalLabel: '/mois',
    features: [
      'Événements illimités',
      'Gestion des équipes',
      'Menus & prestations',
      'Paiements & suivi financier',
      'Tableau de bord avancé',
      'Support prioritaire',
    ],
  },
};

/**
 * Resolve a browser-supplied plan identifier against the server allowlist.
 * Returns null for anything else (invalid strings, ENTERPRISE, objects,
 * empty values). Extra fields such as `amount` are ignored by design —
 * callers must never read pricing from client input.
 */
export function resolvePlan(value: unknown): PlanDetails | null {
  if (value !== 'STARTER' && value !== 'PROFESSIONAL') return null;
  return BILLING_PLANS[value];
}
