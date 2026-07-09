export const MENU = {
  CREATE: {
    SUCCESS: "Menu créé avec succès.",
    ERROR: "Impossible de créer le menu.",
  },
  UPDATE: {
    SUCCESS: "Menu mis à jour avec succès.",
    ERROR: "Impossible de mettre à jour le menu.",
  },
  DELETE: {
    SUCCESS: "Menu supprimé avec succès.",
    ERROR: "Impossible de supprimer le menu.",
  },
  NOT_FOUND: "Menu introuvable.",
  INVALID_INPUT: "Données invalides. Veuillez vérifier les champs.",
  FETCH_ERROR: "Échec du chargement des menus.",
  UNEXPECTED_ERROR: "Une erreur inattendue est survenue.",
  VALIDATION: {
    NAME_MIN_LENGTH: "Le nom doit contenir au moins 2 caractères.",
    INVALID_NUMBER: "Veuillez entrer un nombre valide.",
    PRICE_POSITIVE: "Le prix doit être supérieur à 0.",
    MAX_TABLES_REQUIRED: "Le nombre maximum de tables est obligatoire.",
    MAX_TABLES_MIN_MAX: "Le nombre maximum de tables doit être supérieur ou égal au nombre minimum de tables.",
  },
} as const;
