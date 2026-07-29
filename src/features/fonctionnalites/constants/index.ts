import {
  CalendarCheck,
  FileText,
  MessageCircle,
  CreditCard,
  BarChart3,
  BellRing,
  ClipboardList,
  UserCheck,
  LayoutDashboard,
  Bot,
  Bell,
  MessagesSquare,
  ShieldCheck,
  Headphones,
  Workflow,
  Database,
} from "lucide-react";
import type { Module, WorkflowStep, Reason } from "../types";

export const DASHBOARD_SHOWCASE = {
  recentActivity: [
    { label: "Nouveau client : Marie K.", type: "client" as const },
    { label: "Devis #1042 envoyé", type: "devis" as const },
    { label: "Événement confirmé : 15/09", type: "event" as const },
  ],
  right: {
    items: [
      { icon: LayoutDashboard, text: "Tous vos indicateurs en temps réel" },
      { icon: Bot, text: "Automatisations intelligentes" },
      { icon: Bell, text: "Notifications personnalisées" },
    ],
  },
};

export const PLATFORM_MODULES: Module[] = [
  {
    icon: CalendarCheck,
    title: "Gestion des événements",
    description: "Organisez et suivez tous vos événements depuis un calendrier centralisé intelligent.",
    benefits: ["Calendrier visuel drag-and-drop", "Événements récurrents", "Assignation d'équipe"],
  },
  {
    icon: FileText,
    title: "Devis & Factures",
    description: "Créez des devis professionnels en 30 secondes et transformez-les en factures en un clic.",
    benefits: ["Modèles personnalisables", "Signature électronique", "Relances automatiques"],
  },
  {
    icon: MessageCircle,
    title: "Messagerie unifiée",
    description: "Centralisez WhatsApp, email et notifications internes dans une seule interface.",
    benefits: ["WhatsApp connecté", "Modèles de messages", "Historique complet"],
  },
  {
    icon: CreditCard,
    title: "Paiements & acomptes",
    description: "Acceptez les acomptes et encaissez les paiements facilement, à distance comme sur place.",
    benefits: ["Liens de paiement", "Acomptes sécurisés", "Traçabilité des transactions"],
  },
  {
    icon: BarChart3,
    title: "Tableaux de bord & analytics",
    description: "Visualisez votre performance avec des rapports en temps réel et des analyses prédictives.",
    benefits: ["KPIs personnalisables", "Export PDF/Excel", "Prévisions saisonnières"],
  },
  {
    icon: BellRing,
    title: "Automatisations & rappels",
    description: "Automatisez vos tâches répétitives et ne laissez plus jamais passer une échéance.",
    benefits: ["Rappels SMS/email", "Séquences automatiques", "Règles personnalisées"],
  },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    icon: ClipboardList,
    title: "Créez votre profil",
    description: "Configurez votre entreprise en quelques clics.",
  },
  {
    icon: UserCheck,
    title: "Invitez votre équipe",
    description: "Collaborez avec vos chefs de projet et commis.",
  },
  {
    icon: CalendarCheck,
    title: "Planifiez un événement",
    description: "Ajoutez les détails, le lieu et les prestations.",
  },
  {
    icon: FileText,
    title: "Générez un devis",
    description: "Personnalisez et envoyez instantanément.",
  },
  {
    icon: MessageCircle,
    title: "Confirmez & communiquez",
    description: "Validez avec le client via la messagerie intégrée.",
  },
  {
    icon: BarChart3,
    title: "Suivez votre performance",
    description: "Analysez votre activité et vos résultats.",
  },
];

export const WHY_TRAYTIO: Reason[] = [
  {
    icon: MessagesSquare,
    title: "Communication centralisée",
    description: "Fini les allers-retours entre WhatsApp, email et téléphone. Tous vos échanges au même endroit, tracés et archivés.",
  },
  {
    icon: ShieldCheck,
    title: "Gestion des conflits",
    description: "Notre calendrier intelligent détecte et prévient les doubles bookings, les conflits d'horaire et les chevauchements d'équipe.",
  },
  {
    icon: BarChart3,
    title: "Tableaux de bord prédictifs",
    description: "Anticipez votre trésorerie, visualisez vos tendances saisonnières et prenez des décisions éclairées avec l'IA.",
  },
  {
    icon: Headphones,
    title: "Support prioritaire",
    description: "Un humain vous répond sous 2 heures. Pas de chatbot. Pas d'attente. Une vraie équipe dédiée aux traiteurs.",
  },
  {
    icon: Workflow,
    title: "Automatisation complète",
    description: "Rappels automatiques, relances de paiement, séquences de suivi client. Gagnez 10 heures par semaine.",
  },
  {
    icon: Database,
    title: "Données sécurisées",
    description: "Hébergement européen, chiffrement AES-256, conformité RGPD. Vos données vous appartiennent réellement.",
  },
];
