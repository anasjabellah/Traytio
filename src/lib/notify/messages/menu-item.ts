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
  INVALID_INPUT: "Données invalides. Veuillez vérifier les champs.",
  FETCH_ERROR: "Échec du chargement des articles.",
  IMAGE: {
    UPLOAD_SUCCESS: "Image téléchargée.",
    UPLOAD_ERROR: "Erreur lors du téléchargement de l'image.",
    FORMAT_ERROR: "Format non supporté. Utilisez JPEG, PNG ou WebP.",
    SIZE_ERROR: "L'image dépasse la limite de 10 MB.",
  },
  UNEXPECTED_ERROR: "Une erreur inattendue est survenue.",
  VALIDATION: {
    NAME_MIN_LENGTH: "Le nom doit contenir au moins 2 caractères.",
    CATEGORY_REQUIRED: "Veuillez sélectionner une catégorie.",
    INVALID_PRICE: "Veuillez entrer un nombre valide.",
    PRICE_POSITIVE: "Le prix doit être supérieur à 0.",
  },
} as const;
