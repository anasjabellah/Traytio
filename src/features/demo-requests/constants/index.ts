export const COMPANY_SIZES = [
  { value: 'SOLE', label: 'Indépendant (1 personne)' },
  { value: 'SMALL', label: 'Petite équipe (2–5 personnes)' },
  { value: 'MEDIUM', label: 'Équipe moyenne (6–20 personnes)' },
  { value: 'LARGE', label: 'Grande structure (20+ personnes)' },
] as const;

export const MONTHLY_EVENTS = [
  { value: 'NONE', label: "Je ne fais pas encore d'événements" },
  { value: '1_5', label: '1 à 5 événements / mois' },
  { value: '5_15', label: '5 à 15 événements / mois' },
  { value: '15_50', label: '15 à 50 événements / mois' },
  { value: '50_PLUS', label: 'Plus de 50 événements / mois' },
] as const;
