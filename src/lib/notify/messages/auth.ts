export const AUTH = {
  INVITE: {
    SUCCESS: "Invitation envoyée",
    SUCCESS_DESCRIPTION: (email: string, role: string) =>
      `${email} a été invité comme ${role}`,
    ERROR: "Erreur lors de l'invitation",
    EMAIL_INVALID: "Email invalide",
  },
  ROLE: {
    UPDATE_SUCCESS: "Rôle modifié",
    UPDATE_ERROR: "Erreur lors de la modification du rôle",
  },
  MEMBER: {
    REMOVE_SUCCESS: "Membre supprimé",
    REMOVE_ERROR: "Erreur lors de la suppression du membre",
  },
  OWNERSHIP: {
    TRANSFER_SUCCESS: "Propriété transférée",
    TRANSFER_ERROR: "Erreur lors du transfert de propriété",
  },
  INVITATION: {
    CANCEL_SUCCESS: "Invitation annulée",
    CANCEL_ERROR: "Erreur lors de l'annulation de l'invitation",
  },
  ERROR: "Erreur",
} as const;
