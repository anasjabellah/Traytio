import { COMMON } from "./common";
import { VALIDATION } from "./validation";

export const PAYMENT = {
  CREATE: {
    SUCCESS: "Paiement enregistré avec succès",
    ERROR: "Erreur lors de l'enregistrement du paiement",
  },
  DELETE: {
    SUCCESS: "Paiement supprimé avec succès",
    ERROR: "Erreur lors de la suppression du paiement",
    UNEXPECTED_ERROR: "Erreur inattendue lors de la suppression",
  },
  VALIDATION: {
    AMOUNT_REQUIRED: VALIDATION.INVALID_AMOUNT,
    DATE_REQUIRED: VALIDATION.INVALID_DATE,
    INVALID_DATA: COMMON.INVALID_DATA,
    INVALID_METHOD: "Veuillez sélectionner un moyen de paiement valide.",
    AMOUNT_EXCEEDS_BALANCE: (amount: string, remaining: string) =>
      `Le montant (${amount} MAD) dépasse le solde restant (${remaining} MAD)`,
  },
  NOT_FOUND: "Paiement introuvable ou accès refusé",
  NOT_FOUND_COMMANDE: "Commande introuvable ou accès refusé",
  NOT_FOUND_COMMANDE_ALT: "Commande introuvable",
  NOT_FOUND_COMMANDE_LINKED: "Commande liée introuvable",
  INVALID_ID: "ID de paiement invalide",
  FETCH_ERROR: "Erreur lors du chargement des paiements",
  ERROR_GENERIC: COMMON.ERROR,
  UNEXPECTED_ERROR: "Erreur inattendue",
  ACTIVITY: {
    CREATE: {
      ACTION: "Paiement enregistré",
      DESCRIPTION: (amount: string, method: string, reference: string | null) =>
        `Montant: ${amount} MAD | Méthode: ${method}${reference ? ` | Réf: ${reference}` : ""}`,
    },
    DELETE: {
      ACTION: "Paiement supprimé",
      DESCRIPTION: (amount: string, method: string, reference: string | null) =>
        `Montant: ${amount} MAD | Méthode: ${method}${reference ? ` | Réf: ${reference}` : ""}`,
    },
  },
} as const;
