export type Client = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vip?: boolean;
  events?: number;
  address?: string;
  notes?: string;
  _count?: { events: number };
};

export type SelectedItem = { id: string; qty: number; note?: string };

export type Cat = "Food" | "Drinks" | "Desserts" | "Decoration" | "Extras";

export type Task = { id: string; label: string; done: boolean };

export type Attachment = { name: string; size: string };

export type MenuItem = {
  id: string;
  name: string;
  category: Cat;
  price: number;
  description: string;
  emoji: string;
  tag?: string;
};
