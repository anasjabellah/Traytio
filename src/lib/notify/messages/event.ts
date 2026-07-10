import { COMMON } from "./common";
import { VALIDATION } from "./validation";

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
  INVALID_INPUT: COMMON.INVALID_INPUT,
  FETCH_ERROR: "Échec du chargement des événements.",
  CONFLICT_CHECK_ERROR: "Échec de la vérification des conflits.",
  UNEXPECTED_ERROR: COMMON.UNEXPECTED_ERROR,
  VALIDATION: {
    NAME_MIN_LENGTH: VALIDATION.NAME_MIN_LENGTH,
    REQUIRED_FIELD: VALIDATION.REQUIRED_FIELD,
    INVALID_DATE: VALIDATION.INVALID_DATE,
    INVALID_VALUE: VALIDATION.INVALID_VALUE,
    INVALID_TYPE: "Veuillez sélectionner un type d'événement.",
    DATE_IN_PAST: "La date de l'événement ne peut pas être antérieure à aujourd'hui.",
    START_TIME_IN_PAST: "L'heure de début ne peut pas être antérieure à l'heure actuelle.",
    SAME_START_END: "L'heure de fin doit être différente de l'heure de début.",
    MIN_DURATION: "La durée doit être d'au moins 30 minutes.",
  },
  DRAG: {
    DROP_SUCCESS: "Événement déplacé.",
    DROP_ERROR: "Erreur lors du déplacement.",
    RESIZE_SUCCESS: "Événement redimensionné.",
    RESIZE_ERROR: "Erreur lors du redimensionnement.",
  },
  DUPLICATE: {
    SUCCESS: "Événement dupliqué.",
    ERROR: "Erreur lors de la duplication.",
  },
} as const;
