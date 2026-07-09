export const COMMANDE = {
  CREATE: {
    SUCCESS: "Commande créée avec succès.",
    SUCCESS_WITH_UPLOAD_ERRORS: (count: number) => `Commande créée, mais ${count} fichier(s) n'ont pas pu être téléchargés.`,
    ERROR: "Impossible de créer la commande.",
    ERROR_RETRIES: "Impossible de créer la commande après plusieurs tentatives.",
  },
  UPDATE: {
    SUCCESS: "Commande mise à jour avec succès.",
    SUCCESS_WITH_UPLOAD_ERRORS: (count: number) => `Commande mise à jour, mais ${count} fichier(s) n'ont pas pu être téléchargés.`,
    ERROR: "Impossible de mettre à jour la commande.",
  },
  DELETE: {
    SUCCESS: (number: string) => `${number} a été supprimée.`,
    SUCCESS_TITLE: "Commande supprimée.",
    ERROR: "Impossible de supprimer la commande.",
    ERROR_INVOICES: "Impossible de supprimer cette commande car elle a des factures liées.",
  },
  NOT_FOUND: "Commande introuvable.",
  NOT_FOUND_OR_ACCESS_DENIED: "Commande introuvable ou accès refusé.",
  EVENT_NOT_FOUND: "Événement introuvable ou accès refusé.",
  FETCH_ERROR: "Échec du chargement des commandes.",
  FETCH_ERROR_MENUS: "Échec du chargement des menus.",
  FETCH_ERROR_ITEMS: "Échec du chargement des articles.",
  FETCH_ERROR_CLIENTS: "Échec du chargement des clients.",
  FETCH_ERROR_EVENTS: "Échec du chargement des événements.",
  UNEXPECTED_ERROR: "Une erreur inattendue est survenue.",
  NO_CLIENT_SELECTED: "Aucun client sélectionné.",
  FILE: {
    REJECTED: (name: string) => `Fichier refusé : ${name} — type ou taille non autorisé.`,
  },
  CLIENT: {
    ERROR: "Impossible de créer le client.",
  },
  ATTACHMENT: {
    ERROR: "Impossible de créer la pièce jointe.",
  },
  QUOTE: {
    SUCCESS: "Devis créé avec succès.",
    ERROR: "Impossible de créer le devis.",
  },
  INVOICE: {
    SUCCESS: "Facture créée avec succès.",
    ERROR: "Impossible de créer la facture.",
    CONVERT_SUCCESS: "Facture créée à partir du devis.",
    CONVERT_ERROR: "Impossible de convertir le devis en facture.",
  },
  DOWNLOAD: {
    ERROR: "Échec du téléchargement.",
  },
  STATUS: {
    UPDATE_SUCCESS: "Statut mis à jour avec succès.",
    UPDATE_ERROR: "Impossible de mettre à jour le statut.",
  },
  WHATSAPP: {
    COMING_SOON: "Envoi WhatsApp — bientôt disponible.",
  },
  VALIDATION: {
    NAME_REQUIRED: "Le nom est requis.",
    EMAIL_INVALID: "Email invalide.",
    INVALID_DATA: "Données invalides.",
    ATTACHMENT_NAME_REQUIRED: "Le nom est requis.",
    ATTACHMENT_URL_REQUIRED: "L'URL est requise.",
    ATTACHMENT_TYPE_REQUIRED: "Le type est requis.",
    INVALID_INPUT: "Données invalides. Veuillez vérifier les champs.",
  },
} as const;
