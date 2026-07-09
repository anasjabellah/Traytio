export const INVOICE = {
  CREATE: {
    QUOTE: {
      ERROR: "Erreur lors de la création du devis.",
      ERROR_RETRIES: "Erreur lors de la création du devis après plusieurs tentatives.",
    },
    INVOICE: {
      ERROR: "Erreur lors de la création de la facture.",
      ERROR_RETRIES: "Erreur lors de la création de la facture après plusieurs tentatives.",
    },
  },
  UPDATE: {
    STATUS: {
      ERROR: "Erreur lors de la mise à jour du statut.",
    },
  },
  CONVERT: {
    ERROR: "Erreur lors de la conversion du devis en facture.",
    ERROR_RETRIES: "Erreur lors de la conversion du devis après plusieurs tentatives.",
  },
  NOT_FOUND: "Document introuvable.",
  NOT_FOUND_ORGANIZATION: "Organisation introuvable.",
  NOT_FOUND_QUOTE: "Devis introuvable.",
  NOT_FOUND_COMMANDE: "Commande introuvable.",
  NOT_FOUND_COMMANDE_LINKED: "Commande liée introuvable.",
  NO_COMMANDE_LINKED: "Le devis n'est lié à aucune commande.",
  INVALID_STATUS: "Statut invalide.",
  UNEXPECTED_ERROR: "Erreur.",
  SETTINGS: {
    FETCH_ERROR: "Erreur lors de la récupération des paramètres.",
    SAVE_SUCCESS: "Paramètres enregistrés.",
    SAVE_ERROR: "Erreur lors de la sauvegarde des paramètres.",
    LOGO_SUCCESS: "Logo mis à jour.",
    LOGO_ERROR: "Erreur lors du téléchargement du logo.",
    LOGO_INVALID: "Veuillez sélectionner une image.",
    LOGO_SIZE: "L'image dépasse la limite de 10 MB.",
  },
} as const;
