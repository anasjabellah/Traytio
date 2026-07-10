import { COMMON } from "./common";
import { VALIDATION } from "./validation";
import { UPLOAD } from "./upload";

export const MENU_ITEM = {
  CREATE: {
    SUCCESS: "Article créé avec succès.",
    ERROR: "Impossible de créer l'article.",
  },
  UPDATE: {
    SUCCESS: "Article mis à jour avec succès.",
    ERROR: "Impossible de mettre à jour l'article.",
  },
  DELETE: {
    SUCCESS: "Article supprimé avec succès.",
    ERROR: "Impossible de supprimer l'article.",
  },
  DUPLICATE: {
    SUCCESS: "Article dupliqué avec succès.",
    ERROR: "Impossible de dupliquer l'article.",
  },
  ARCHIVE: {
    SUCCESS_ARCHIVED: "Article archivé.",
    SUCCESS_REACTIVATED: "Article réactivé.",
    ERROR: "Impossible de modifier le statut de l'article.",
  },
  NOT_FOUND: "Article introuvable.",
  INVALID_INPUT: COMMON.INVALID_INPUT,
  FETCH_ERROR: "Échec du chargement des articles.",
  IMAGE: {
    UPLOAD_SUCCESS: UPLOAD.UPLOAD_SUCCESS,
    UPLOAD_ERROR: UPLOAD.UPLOAD_FAILED,
    FORMAT_ERROR: UPLOAD.UNSUPPORTED_FORMAT,
    SIZE_ERROR: UPLOAD.FILE_TOO_LARGE_SIZE("10 MB"),
  },
  UNEXPECTED_ERROR: COMMON.UNEXPECTED_ERROR,
  VALIDATION: {
    NAME_MIN_LENGTH: VALIDATION.NAME_MIN_LENGTH,
    CATEGORY_REQUIRED: "Veuillez sélectionner une catégorie.",
    INVALID_PRICE: VALIDATION.INVALID_NUMBER,
    PRICE_POSITIVE: VALIDATION.PRICE_POSITIVE,
  },
} as const;
