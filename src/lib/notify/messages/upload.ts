export const UPLOAD = {
  UPLOAD_STARTED: "Téléchargement en cours...",
  UPLOAD_SUCCESS: "Fichier téléchargé.",
  UPLOAD_FAILED: "Échec du téléchargement.",
  FILE_TOO_LARGE: "Le fichier dépasse la limite autorisée.",
  FILE_TOO_LARGE_SIZE: (size: string) => `Le fichier dépasse la limite de ${size}.`,
  UNSUPPORTED_FORMAT: "Format non supporté.",
  IMAGE_REQUIRED: "Veuillez sélectionner une image.",
  UPLOAD_CANCELLED: "Téléchargement annulé.",
  REJECTED: (name: string) => `Fichier refusé : ${name} — type ou taille non autorisé.`,
} as const;
