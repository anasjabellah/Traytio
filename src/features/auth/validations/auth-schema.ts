import { z } from "zod";

import { VALIDATION } from "@/lib/notify/messages";

const email = z
  .string()
  .trim()
  .min(1, VALIDATION.REQUIRED_FIELD)
  .email(VALIDATION.INVALID_EMAIL);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, VALIDATION.REQUIRED_FIELD),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, VALIDATION.NAME_REQUIRED),
    lastName: z.string().trim().min(1, VALIDATION.NAME_REQUIRED),
    email,
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(1, VALIDATION.REQUIRED_FIELD),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const verificationCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code de vérification doit contenir 6 chiffres."),
});

export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;
