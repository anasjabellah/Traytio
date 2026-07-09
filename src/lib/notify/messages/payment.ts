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
    AMOUNT_REQUIRED: "Le montant doit être supérieur à 0",
    DATE_REQUIRED: "La date est requise",
  },
  UNEXPECTED_ERROR: "Erreur inattendue",
} as const;
