import { COMMON } from "./common";

export const AUTH = {
  INVITE: {
    SUCCESS: "Invitation envoyée",
    SUCCESS_DESCRIPTION: (email: string, role: string) =>
      `${email} a été invité comme ${role}`,
    ERROR: "Erreur lors de l'invitation",
    EMAIL_INVALID: "Email invalide",
    INVALID_EMAIL: "Adresse email invalide",
    EMAIL_SEND_FAILED: "Impossible d'envoyer l'email d'invitation. Veuillez réessayer.",
  },
  ROLE: {
    UPDATE_SUCCESS: "Rôle modifié",
    UPDATE_ERROR: "Erreur lors de la modification du rôle",
    CANNOT_CHANGE_OWN_ROLE: "Vous ne pouvez pas modifier votre propre rôle",
    CAN_ONLY_CHANGE_MEMBERS: "Vous ne pouvez modifier que les rôles des membres",
    CANNOT_DOWNGRADE_LAST_OWNER: "Impossible de rétrograder le dernier propriétaire",
    CHANGE_ERROR: "Erreur lors du changement de rôle",
  },
  MEMBER: {
    REMOVE_SUCCESS: "Membre supprimé",
    REMOVE_ERROR: "Erreur lors de la suppression du membre",
    NOT_FOUND: "Membre introuvable",
    CANNOT_REMOVE_SELF: "Vous ne pouvez pas vous retirer vous-même",
    CAN_ONLY_REMOVE_MEMBERS: "Vous ne pouvez supprimer que les membres",
    CANNOT_DELETE_LAST_OWNER: "Impossible de supprimer le dernier propriétaire",
  },
  OWNERSHIP: {
    TRANSFER_SUCCESS: "Propriété transférée",
    TRANSFER_ERROR: "Erreur lors du transfert de propriété",
    ONLY_OWNER_CAN_TRANSFER: "Seul le propriétaire peut transférer la propriété",
    ONLY_OWNER_CAN_TRANSFER_ALT: "Seul le propriétaire actuel peut transférer la propriété",
    TRANSFER_TO_ADMIN_ONLY: "Vous ne pouvez transférer la propriété qu'à un administrateur",
    ALREADY_OWNER: "Vous êtes déjà le propriétaire",
  },
  INVITATION: {
    CANCEL_SUCCESS: "Invitation annulée",
    CANCEL_ERROR: "Erreur lors de l'annulation de l'invitation",
    NOT_FOUND: "Invitation introuvable",
    INVALID_OR_MISSING: "Invitation invalide ou inexistante",
    EXPIRED: "Cette invitation a expiré",
    ALREADY_PENDING: "Une invitation est déjà en attente pour cet email",
    EMAIL_MISMATCH: (invitedEmail: string, userEmail: string) =>
      `Cette invitation a été envoyée à ${invitedEmail}, pas à ${userEmail}`,
  },
  SESSION: {
    UNAUTHORIZED: "Non authentifié",
    REQUIRED: "Vous devez être connecté pour accepter une invitation",
    EXPIRED: "Session expirée",
  },
  ACCEPT: {
    INVALID_LINK: "Lien d'invitation invalide",
    INVALID_OR_EXPIRED: "Invitation invalide ou expirée",
    SUCCESS_TITLE: "Invitation acceptée !",
    SUCCESS_DESCRIPTION_PREFIX: "Vous faites désormais partie de",
    SUCCESS_DESCRIPTION_SUFFIX: ".",
    ERROR: "Erreur lors de l'acceptation",
    LOADING: "Vérification de l'invitation...",
    EMAIL_MISMATCH_PREFIX: "Connecté en tant que",
    EMAIL_MISMATCH_MIDDLE: ", mais l'invitation a été envoyée à",
    EMAIL_MISMATCH_SUFFIX: ". Veuillez vous connecter avec le bon compte.",
  },
  SIGN_IN: {
    TITLE: "Bon retour",
    DESCRIPTION: "Connectez-vous à votre compte TUR",
  },
  SIGN_UP: {
    TITLE: "Créer un compte",
    DESCRIPTION: "Gérez votre activité de traiteur",
  },
  ALREADY_MEMBER: "Cet utilisateur est déjà membre de l'organisation",
  USER_NOT_FOUND: "Utilisateur introuvable",
  ORGANIZATION_NOT_FOUND: "Aucune organisation trouvée",
  FETCH_ERROR: COMMON.FETCH_ERROR,
  FORBIDDEN_VIEW_TEAM: "Accès refusé : vous n'avez pas la permission de voir l'équipe",
  ERROR: COMMON.ERROR,
} as const;
