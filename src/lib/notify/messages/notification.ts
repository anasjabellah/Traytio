import { COMMON } from "./common";

export const NOTIFICATION = {
  FETCH_ERROR: "Échec du chargement des notifications.",
  MARK_READ_ERROR: "Impossible de marquer la notification comme lue.",
  MARK_ALL_READ_ERROR: "Impossible de tout marquer comme lu.",
  NOT_FOUND: "Notification introuvable.",
  INVALID_INPUT: COMMON.INVALID_INPUT,
  UNEXPECTED_ERROR: COMMON.UNEXPECTED_ERROR,
  CREATE: {
    COMMANDE_CREATED_TITLE: "Nouvelle commande",
    PAYMENT_RECEIVED_TITLE: "Paiement reçu",
    EVENT_CREATED_TITLE: "Nouvel événement",
    QUOTE_CREATED_TITLE: "Devis créé",
    INVOICE_CREATED_TITLE: "Facture créée",
    TEAM_INVITATION_TITLE: "Invitation envoyée",
  },
} as const;
