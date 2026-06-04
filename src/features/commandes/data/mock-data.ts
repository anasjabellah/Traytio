export type Cat = "Food" | "Drinks" | "Desserts" | "Decoration" | "Extras";

export type SelectedItem = { id: string; qty: number; note?: string };

export type MenuItem = {
  id: string;
  name: string;
  category: Cat;
  price: number;
  description: string;
  emoji: string;
  tag?: string;
};

export const MENU: MenuItem[] = [
  { id: "f1", name: "Bastila au pigeon", category: "Food", price: 22, description: "Feuilleté traditionnel, amandes torréfiées, cannelle.", emoji: "🥟", tag: "Signature" },
  { id: "f2", name: "Tajine d'agneau aux pruneaux", category: "Food", price: 28, description: "Mijoté 6h, amandes effilées, miel d'oranger.", emoji: "🍲" },
  { id: "f3", name: "Foie gras maison & chutney figue", category: "Food", price: 32, description: "Mi-cuit au torchon, pain brioché toasté.", emoji: "🥩", tag: "Premium" },
  { id: "f4", name: "Risotto à la truffe noire", category: "Food", price: 34, description: "Carnaroli, parmesan 24 mois, truffe de saison.", emoji: "🍚", tag: "Premium" },
  { id: "f5", name: "Saumon gravlax & blinis", category: "Food", price: 24, description: "Mariné aneth & betterave, crème acidulée.", emoji: "🐟" },
  { id: "d1", name: "Mojito signature", category: "Drinks", price: 9, description: "Rhum ambré, menthe fraîche, sucre de canne.", emoji: "🍹" },
  { id: "d2", name: "Champagne Ruinart Blanc", category: "Drinks", price: 45, description: "Blanc de blancs, service à la flûte.", emoji: "🥂", tag: "Premium" },
  { id: "d3", name: "Vin Bourgogne — Pinot Noir", category: "Drinks", price: 28, description: "Domaine sélectionné, carafe & service.", emoji: "🍷" },
  { id: "d4", name: "Mocktail floral hibiscus", category: "Drinks", price: 8, description: "Hibiscus, citron vert, eau pétillante.", emoji: "🍸" },
  { id: "ds1", name: "Pièce montée vanille-praliné", category: "Desserts", price: 12, description: "Choux croustillants, caramel filé.", emoji: "🎂", tag: "Signature" },
  { id: "ds2", name: "Tarte citron meringuée", category: "Desserts", price: 14, description: "Sablé breton, meringue italienne flambée.", emoji: "🍋" },
  { id: "ds3", name: "Plateau pâtisseries fines", category: "Desserts", price: 9, description: "Mignardises assorties — 6 pièces / pers.", emoji: "🍰" },
  { id: "de1", name: "Composition florale centrale", category: "Decoration", price: 95, description: "Pivoines, eucalyptus — par table.", emoji: "💐" },
  { id: "de2", name: "Chemin de table or velours", category: "Decoration", price: 25, description: "Linge premium, finition brodée.", emoji: "✨" },
  { id: "de3", name: "Tables Golden Round", category: "Decoration", price: 45, description: "Tables rondes 10 pers, finition dorée.", emoji: "🪑" },
  { id: "x1", name: "Service maître d'hôtel", category: "Extras", price: 180, description: "Coordination & service à table.", emoji: "🎩" },
  { id: "x2", name: "DJ & sonorisation", category: "Extras", price: 850, description: "DJ professionnel + light show.", emoji: "🎧" },
  { id: "x3", name: "Photobooth premium", category: "Extras", price: 450, description: "Cabine élégante, tirages illimités.", emoji: "📸" },
];

export const PACKS = [
  { id: "p1", name: "Wedding Premium", subtitle: "Mariage 80–150 pax", price: 145, items: ["f1", "f3", "f4", "d2", "d3", "ds1", "de1", "x1"], accent: "from-rose-50 to-amber-50" },
  { id: "p2", name: "Corporate Gold", subtitle: "Entreprise 30–80 pax", price: 95, items: ["f2", "f5", "d3", "d4", "ds2", "de2", "x1"], accent: "from-amber-50 to-stone-50" },
  { id: "p3", name: "Birthday VIP", subtitle: "Anniversaire 20–60 pax", price: 110, items: ["f1", "f4", "d1", "d2", "ds1", "de2", "x2"], accent: "from-violet-50 to-amber-50" },
];

export const EVENT_TYPES = ["Mariage", "Entreprise", "Anniversaire", "Cocktail", "Gala", "Privé"];

export const CLIENTS = [
  { id: "c1", name: "Sophie Lambert", phone: "+33 6 12 34 56 78", email: "sophie@lambert.fr", vip: true, events: 4 },
  { id: "c2", name: "Maison Rivière", phone: "+33 1 42 88 14 22", email: "contact@maisonriviere.com", vip: false, events: 7 },
  { id: "c3", name: "Élise Moreau", phone: "+33 6 78 90 12 34", email: "elise.moreau@gmail.com", vip: true, events: 2 },
  { id: "c4", name: "Atelier Noé", phone: "+33 1 55 67 89 02", email: "hello@ateliernoe.fr", vip: false, events: 1 },
];
