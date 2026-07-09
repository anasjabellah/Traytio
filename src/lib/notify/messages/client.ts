export const CLIENT = {
  CREATE: {
    SUCCESS: "Client créé avec succès.",
    ERROR: "Impossible de créer le client.",
  },
  UPDATE: {
    SUCCESS: "Client mis à jour avec succès.",
    ERROR: "Impossible de mettre à jour le client.",
  },
  DELETE: {
    SUCCESS: "Client supprimé avec succès.",
    ERROR: "Impossible de supprimer le client.",
  },
  NOT_FOUND: "Client introuvable.",
  NOT_FOUND_OR_ACCESS_DENIED: "Client introuvable ou accès refusé.",
  DUPLICATE_EMAIL: "Un client avec cet email existe déjà dans votre organisation.",
  HAS_ACTIVE_COMMANDES: "Impossible de supprimer ce client car il possède des commandes actives.",
  ACTIVE_COMMANDES_WARNING: "Ce client possède des commandes actives et ne peut pas être supprimé.",
  INVALID_INPUT: "Données invalides. Veuillez vérifier les champs.",
  FETCH_ERROR: "Échec du chargement des clients.",
  UNEXPECTED_ERROR: "Une erreur inattendue est survenue.",
  VALIDATION: {
    NAME_MIN_LENGTH: "Le nom doit contenir au moins 2 caractères.",
    EMAIL_INVALID: "Email invalide.",
  },
} as const;
