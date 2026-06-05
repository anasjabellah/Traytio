"use client"

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MENU, PACKS, type MenuItem, type Cat, type SelectedItem } from "@/features/commandes/data/mock-data";
import { getCommandeClients } from "@/features/commandes/actions/get-commande-clients";

type Client = any;

export function useCommandeForm() {
  const [client, setClient] = useState<Client>(null);
  const [showClientPanel, setShowClientPanel] = useState(false);

  const [eventName, setEventName] = useState("Mariage Lambert");
  const [eventType, setEventType] = useState("Mariage");
  const [eventDate, setEventDate] = useState("2026-10-12");
  const [startTime, setStartTime] = useState("18:30");
  const [endTime, setEndTime] = useState("01:00");
  const [location, setLocation] = useState("Château de Vaux-le-Vicomte");
  const [guests, setGuests] = useState(80);
  const [budget, setBudget] = useState(18000);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [openCats, setOpenCats] = useState<Record<Cat, boolean>>({
    Food: true, Drinks: true, Desserts: false, Decoration: false, Extras: false,
  });

  const [transport, setTransport] = useState(150);
  const [delivery, setDelivery] = useState(80);
  const [equipment, setEquipment] = useState(0);
  const [extraService, setExtraService] = useState(0);

  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);

  const [depositPercent, setDepositPercent] = useState(30);

  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([
    { name: "brief-client.pdf", size: "284 KB" },
  ]);
  const [internalNotes, setInternalNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [tasks, setTasks] = useState([
    { id: "t1", label: "Commander les fleurs (pivoines)", done: true },
    { id: "t2", label: "Confirmer DJ pour 21h", done: false },
    { id: "t3", label: "Préparer la pièce montée — vendredi", done: false },
    { id: "t4", label: "Confirmer transport équipement", done: false },
    { id: "t5", label: "Réserver les tables Golden Round", done: false },
  ]);

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["commande-clients"],
    queryFn: () => getCommandeClients(),
  });

  const selectedList = useMemo(
    () => Object.values(selected).filter((s) => s.qty > 0).map((s) => ({ ...s, item: MENU.find((m) => m.id === s.id)! })),
    [selected],
  );
  const itemsSubtotal = selectedList.reduce((acc, s) => acc + s.item.price * s.qty, 0);
  const extrasTotal = transport + delivery + equipment + extraService;
  const preDiscount = itemsSubtotal + extrasTotal;
  const discountAmount = discountType === "percent" ? (preDiscount * discountValue) / 100 : discountValue;
  const total = Math.max(0, preDiscount - discountAmount);
  const deposit = (total * depositPercent) / 100;
  const remaining = total - deposit;
  const budgetUsed = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const overBudget = total > budget && budget > 0;

  const setQty = (id: string, qty: number) =>
    setSelected((s) => ({ ...s, [id]: { ...(s[id] ?? { id }), id, qty: Math.max(0, qty) } }));
  const setNote = (id: string, note: string) =>
    setSelected((s) => ({ ...s, [id]: { ...(s[id] ?? { id, qty: 0 }), id, note } }));
  const toggleItem = (id: string) => {
    const current = selected[id]?.qty || 0;
    setQty(id, current > 0 ? 0 : guests);
  };
  const applyPack = (packId: string) => {
    const pack = PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setSelectedPack(packId);
    const next: Record<string, SelectedItem> = {};
    pack.items.forEach((id) => (next[id] = { id, qty: guests }));
    setSelected(next);
  };

  const dateHash = eventDate.split("-").reduce((a, b) => a + parseInt(b, 10), 0);
  const dateAvailable = dateHash % 3 !== 0;

  const state = {
    client, setClient, showClientPanel, setShowClientPanel,
    eventName, setEventName, eventType, setEventType,
    eventDate, setEventDate, startTime, setStartTime, endTime, setEndTime,
    location, setLocation, guests, setGuests, budget, setBudget,
    contactPerson, setContactPerson, contactPhone, setContactPhone,
    eventNotes, setEventNotes, selectedPack, setSelectedPack,
    selected, setSelected, openCats, setOpenCats,
    transport, setTransport, delivery, setDelivery,
    equipment, setEquipment, extraService, setExtraService,
    discountType, setDiscountType, discountValue, setDiscountValue,
    depositPercent, setDepositPercent, attachments, setAttachments,
    internalNotes, setInternalNotes, clientNotes, setClientNotes,
    tasks, setTasks,
  };

  const derived = {
    selectedList, itemsSubtotal, extrasTotal, preDiscount,
    discountAmount, total, deposit, remaining, budgetUsed, overBudget,
  };

  const handlers = {
    setQty, setNote, toggleItem, applyPack,
  };

  return {
    state, derived, handlers, dateAvailable,
    clients: Array.isArray(clients) ? clients : [],
    isClientsLoading: clientsLoading,
  };
}
