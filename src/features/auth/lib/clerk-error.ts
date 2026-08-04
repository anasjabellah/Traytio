import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

const DEFAULT_ERROR = "Une erreur est survenue. Veuillez réessayer.";

const MESSAGES: Record<string, string> = {
  form_identifier_not_found: "Aucun compte n'existe avec cette adresse email.",
  form_email_address_not_found: "Aucun compte n'existe avec cette adresse email.",
  form_username_not_found: "Ce nom d'utilisateur est introuvable.",
  form_phone_number_not_found: "Ce numéro de téléphone est introuvable.",
  form_password_incorrect: "Mot de passe incorrect.",
  form_password_length_too_short:
    "Le mot de passe doit contenir au moins 8 caractères.",
  form_password_pwned:
    "Ce mot de passe est trop courant ou a été compromis. Choisissez-en un autre.",
  form_password_validation_failed:
    "Le mot de passe ne respecte pas les exigences de sécurité.",
  form_identifier_exists: "Un compte existe déjà avec cette adresse email.",
  form_email_address_exists: "Un compte existe déjà avec cette adresse email.",
  form_username_exists: "Ce nom d'utilisateur est déjà utilisé.",
  form_param_nil: "Veuillez remplir tous les champs.",
  form_param_invalid: "L'un des champs fournis est invalide.",
  form_code_incorrect: "Le code est incorrect. Vérifiez et réessayez.",
  form_code_expired: "Ce code a expiré. Demandez-en un nouveau.",
  form_verification_missing: "La vérification est requise pour continuer.",
  too_many_requests: "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
  not_allowed_access: "Accès non autorisé.",
};

const FIELD_BY_PARAM: Record<string, string> = {
  emailAddress: "email",
  identifier: "email",
  password: "password",
  firstName: "firstName",
  lastName: "lastName",
  code: "code",
};

export function clerkErrorToMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors?.[0];
    if (first?.code && MESSAGES[first.code]) return MESSAGES[first.code];
    if (first?.longMessage) return first.longMessage;
  }
  return DEFAULT_ERROR;
}

export function clerkFieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isClerkAPIResponseError(error)) return out;
  for (const err of error.errors ?? []) {
    const param = err.meta?.paramName;
    if (!param || !FIELD_BY_PARAM[param]) continue;
    const message =
      (err.code && MESSAGES[err.code]) ?? err.longMessage ?? err.message;
    if (message) out[FIELD_BY_PARAM[param]] = message;
  }
  return out;
}
