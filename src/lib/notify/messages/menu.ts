import { COMMON } from "./common";
import { VALIDATION } from "./validation";

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
  INVALID_INPUT: COMMON.INVALID_INPUT,
  FETCH_ERROR: "Échec du chargement des menus.",
  UNEXPECTED_ERROR: COMMON.UNEXPECTED_ERROR,
  VALIDATION: {
    NAME_MIN_LENGTH: VALIDATION.NAME_MIN_LENGTH,
    INVALID_NUMBER: VALIDATION.INVALID_NUMBER,
    PRICE_POSITIVE: VALIDATION.PRICE_POSITIVE,
    MAX_TABLES_REQUIRED: "Le nombre maximum de tables est obligatoire.",
    MAX_TABLES_MIN_MAX: "Le nombre maximum de tables doit être supérieur ou égal au nombre minimum de tables.",
  },
} as const;
