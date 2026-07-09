export const EVENT = {
  CREATE: {
    SUCCESS: "Événement créé avec succès.",
    ERROR: "Impossible de créer l'événement.",
  },
  UPDATE: {
    SUCCESS: "Événement mis à jour avec succès.",
    ERROR: "Impossible de mettre à jour l'événement.",
  },
  DELETE: {
    SUCCESS: "Événement supprimé avec succès.",
    ERROR: "Impossible de supprimer l'événement.",
  },
  NOT_FOUND: "Événement introuvable.",
  INVALID_INPUT: "Données invalides. Veuillez vérifier les champs.",
  FETCH_ERROR: "Échec du chargement des événements.",
  CONFLICT_CHECK_ERROR: "Échec de la vérification des conflits.",
  UNEXPECTED_ERROR: "Une erreur inattendue est survenue.",
  VALIDATION: {
    NAME_MIN_LENGTH: "Le nom doit contenir au moins 2 caractères.",
    REQUIRED_FIELD: "Ce champ est obligatoire.",
    INVALID_DATE: "Veuillez sélectionner une date.",
    INVALID_VALUE: "Valeur invalide.",
    INVALID_TYPE: "Veuillez sélectionner un type d'événement.",
    DATE_IN_PAST: "La date de l'événement doit être aujourd'hui ou dans le futur.",
    SAME_START_END: "L'heure de fin doit être différente de l'heure de début.",
    MIN_DURATION: "La durée doit être d'au moins 30 minutes.",
  },
} as const;
