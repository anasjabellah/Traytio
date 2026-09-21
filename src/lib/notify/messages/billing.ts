import { COMMON } from "./common";

export const BILLING = {
  CHECKOUT: {
    SUCCESS: "Redirection vers le paiement...",
    ERROR: "Impossible de créer la session de paiement.",
    INVALID_PLAN: "Formule invalide. Choisissez Starter ou Professional.",
    UNAUTHORIZED_ROLE: "Seul le propriétaire de l'organisation peut gérer l'abonnement.",
  },
  PORTAL: {
    ERROR: "Impossible d'ouvrir le portail de facturation.",
    NO_SUBSCRIPTION: "Aucun abonnement trouvé pour cette organisation.",
    NO_PORTAL_URL: "Le portail de facturation est momentanément indisponible.",
  },
  WEBHOOK: {
    RECEIVED: "Événement reçu.",
  },
  INVALID_INPUT: COMMON.INVALID_INPUT,
  UNEXPECTED_ERROR: COMMON.UNEXPECTED_ERROR,
} as const;
