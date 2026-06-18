"use client"

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SelectedItem } from "@/features/commandes/data/mock-data";
import { getCommandeClients } from "@/features/commandes/actions/get-commande-clients";
import { getCommandeMenus } from "@/features/commandes/actions/get-commande-menus";
import { getCommandeAllMenuItems } from "@/features/commandes/actions/get-commande-all-menu-items";
import { getCommandeClientEvents, type ClientEventSummary } from "@/features/commandes/actions/get-commande-client-events";
import { generateCommandeNumber, createCommande } from "@/features/commandes/actions/create-commande";
import { createCommandeAttachment } from "@/features/commandes/actions/create-commande-attachment";
import type { Client, MenuItemDisplay } from "@/features/commandes/types";

export function useCommandeForm() {
  const [client, setClient] = useState<Client | null>(null);
  const [showClientPanel, setShowClientPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClientEventSummary | "new" | null>(null);

  const [eventName, setEventName] = useState("Mariage Lambert");
  const [eventType, setEventType] = useState("Mariage");
  const [eventDate, setEventDate] = useState("2026-10-12");
  const [startTime, setStartTime] = useState("18:30");
  const [endTime, setEndTime] = useState("01:00");
  const [location, setLocation] = useState("Château de Vaux-le-Vicomte");
  const [guests, setGuests] = useState(0);
  const [budget, setBudget] = useState(0);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const [transport, setTransport] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [equipment, setEquipment] = useState(0);
  const [extraService, setExtraService] = useState(0);

  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);

  const [depositPercent, setDepositPercent] = useState(0);

  const [attachments, setAttachments] = useState<any[]>([]);
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

  const { data: rawMenus } = useQuery({
    queryKey: ["commande-menus"],
    queryFn: () => getCommandeMenus(),
  });

  const { data: allMenuItems } = useQuery({
    queryKey: ["commande-all-menu-items"],
    queryFn: () => getCommandeAllMenuItems(),
  });

  const clientId = client?.id ?? null;
  const { data: clientEvents, isLoading: clientEventsLoading } = useQuery({
    queryKey: ["commande-client-events", clientId],
    queryFn: () => getCommandeClientEvents(clientId!),
    enabled: !!clientId,
  });

  const packs: Array<{ id: string; name: string; subtitle: string; price: number; items: string[]; accent: string }> = useMemo(() => {
    if (!rawMenus || !Array.isArray(rawMenus)) return [];
    return rawMenus.map((menu: any) => ({
      id: menu.id,
      name: menu.name,
      subtitle: menu.description ?? "",
      price: menu.price ?? 0,
      items: (menu.items ?? []).map((i: any) => i.id as string),
      accent: "from-amber-50 to-stone-50",
    }));
  }, [rawMenus]);

  const CATEGORY_MAP: Record<string, string> = {
    FOOD: "Food", DRINKS: "Drinks", DESSERTS: "Desserts",
    DECORATION: "Decoration", SERVICES: "Services",
    ENTERTAINMENT: "Divertissement", STAFF: "Extras", EXTRAS: "Extras",
  };

  const CAT_EMOJI: Record<string, string> = {
    Food: "\uD83C\uDF7D\uFE0F", Drinks: "\uD83E\uDD42", Desserts: "\uD83C\uDF70",
    Decoration: "\uD83D\uDC90", Services: "\uD83D\uDEC2", Divertissement: "\uD83C\uDFB6", Extras: "\u2728",
  };

  const menuItems: MenuItemDisplay[] = useMemo(() => {
    const isMenuSelected = selectedPack !== null;

    if (isMenuSelected) {
      if (!rawMenus || !Array.isArray(rawMenus)) return [];
      const pack = (rawMenus as any[]).find((m: any) => m.id === selectedPack);
      if (!pack) return [];
      const items = ((pack as any).items ?? []) as any[];
      if (typeof window !== "undefined") {
        console.log("[commande-form] mode: MENU_ITEMS | selectedMenuId:", selectedPack, "| count:", items.length);
      }
      return items.map((i: any) => {
        const cat = CATEGORY_MAP[i.category] ?? "Extras";
        return {
          id: i.id,
          name: i.name,
          category: cat,
          price: i.unitPrice ?? 0,
          description: i.notes ?? "",
          imageUrl: i.imageUrl ?? undefined,
          emoji: CAT_EMOJI[cat],
        };
      });
    }

    if (!allMenuItems || !Array.isArray(allMenuItems)) return [];
    if (typeof window !== "undefined") {
      console.log("[commande-form] mode: ALL_ITEMS | selectedMenuId: null | count:", allMenuItems.length);
    }
    return allMenuItems.map((i: any) => {
      const cat = CATEGORY_MAP[i.category] ?? "Extras";
      return {
        id: i.id,
        name: i.name,
        category: cat,
        price: i.unitPrice ?? 0,
        description: i.notes ?? "",
        imageUrl: i.imageUrl ?? undefined,
        emoji: CAT_EMOJI[cat],
      };
    });
  }, [rawMenus, selectedPack, allMenuItems]);

  const selectedList = useMemo(
    () => Object.values(selected).filter((s) => s.qty > 0).map((s) => {
      const item = menuItems.find((m) => m.id === s.id);
      return { ...s, item: item ?? { id: s.id, name: "Inconnu", category: "Extras", price: 0, description: "" } };
    }),
    [selected, menuItems],
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
    setQty(id, current > 0 ? 0 : Math.max(guests, 1));
  };
  const applyPack = (packId: string) => {
    if (packId === selectedPack) {
      setSelectedPack(null);
      setSelected({});
      return;
    }
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return;
    setSelectedPack(packId);
    const next: Record<string, SelectedItem> = {};
    pack.items.forEach((id) => (next[id] = { id, qty: Math.max(guests, 1) }));
    setSelected(next);
  };

  const EVENT_TYPE_MAP: Record<string, string> = {
    WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
    ANNIVERSARY: "Mariage", HOLIDAY: "Cocktail", OTHER: "Privé",
  };

  const FR_TO_EN_EVENT_TYPE: Record<string, string> = {
    "Mariage": "WEDDING",
    "Entreprise": "CORPORATE",
    "Anniversaire": "ANNIVERSARY",
    "Fête": "BIRTHDAY",
    "Vacances": "HOLIDAY",
    "Autre": "OTHER",
  };

  const handleClientChange = useCallback((c: Client | null) => {
    setClient(c);
    setSelectedEvent(null);
    if (!c) {
      setEventName(""); setEventType(""); setEventDate(""); setStartTime("");
      setEndTime(""); setLocation(""); setGuests(80); setBudget(0);
    setContactPerson(""); setContactPhone(""); setEventNotes("");
    setEventStatus(null);
    }
  }, []);

  const handleSelectEvent = useCallback((event: ClientEventSummary) => {
    setSelectedEvent(event);
    setEventName(event.name);
    setEventType(EVENT_TYPE_MAP[event.type] ?? event.type);
    const start = new Date(event.startDate);
    setEventDate(start.toISOString().split("T")[0]);
    setStartTime(`${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`);
    if (event.endDate) {
      const end = new Date(event.endDate);
      setEndTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
    } else {
      setEndTime("");
    }
    setLocation(event.location ?? "");
    setGuests(event.guestCount ?? 80);
    setBudget(event.budget ? Number(event.budget) : 0);
    setContactPerson(event.contactPerson ?? "");
    setContactPhone(event.contactPhone ?? "");
    setEventNotes(event.notes ?? "");
    setEventStatus(event.status ?? null);
  }, []);

  const handleCreateNewEvent = useCallback(() => {
    setSelectedEvent("new");
    setEventName(""); setEventType(""); setEventDate(""); setStartTime("");
    setEndTime(""); setLocation(""); setGuests(80); setBudget(0);
    setContactPerson(""); setContactPhone(""); setEventNotes("");
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (): Promise<{ success: true; data: { id: string }; uploadErrors?: string[] } | { success: false; error: string }> => {
    if (!client) return { success: false as const, error: "Aucun client sélectionné" };
    setIsSubmitting(true);
    try {
      const number = await generateCommandeNumber();
      const discountTypeDb = discountType === "percent" ? "PERCENTAGE" : "FIXED";
      const eventDateTime = eventDate && startTime ? `${eventDate}T${startTime}:00` : eventDate || null;
      const packName = selectedPack ? packs.find(p => p.id === selectedPack)?.name ?? null : null;
      const items = selectedList.map(s => ({
        name: s.item.name,
        quantity: s.qty,
        unitPrice: s.item.price,
        totalPrice: s.item.price * s.qty,
        menuItemId: s.id,
      }));
      const result = await createCommande({
        number,
        clientId: client.id,
        eventName: eventName || null,
        eventStatus: eventStatus,
        eventType: (eventType ? FR_TO_EN_EVENT_TYPE[eventType] ?? null : null),
        eventDate: eventDateTime,
        guestCount: guests || null,
        location: location || null,
        menuId: selectedPack,
        menuName: packName,
        pricePerPerson: null,
        totalAmount: total,
        transportFees: transport,
        deliveryFees: delivery,
        equipmentFees: equipment,
        discountType: discountValue > 0 ? discountTypeDb : null,
        discountValue: discountValue || null,
        discountAmount: discountAmount || null,
        acomptePercent: depositPercent,
        acompteAmount: deposit,
        remainingAmount: remaining,
        clientBudget: budget || null,
        contactName: contactPerson || null,
        contactPhone: contactPhone || null,
        notes: eventNotes || null,
        internalNotes: internalNotes || null,
        clientNotes: clientNotes || null,
        status: "DRAFT",
        items,
      });
      if (!result.success || !result.data) return { success: false as const, error: result.error ?? "Erreur lors de la création" };

      const commandeId = result.data.id;
      const uploadErrors: string[] = [];
      for (const file of attachments) {
        if (!(file instanceof File)) continue;
        try {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("Upload failed");
          const { url } = await uploadRes.json();
          await createCommandeAttachment(commandeId, file.name, url, file.type);
        } catch {
          uploadErrors.push(file.name);
        }
      }

      return { success: true as const, data: { id: commandeId }, uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined };
    } finally {
      setIsSubmitting(false);
    }
  }, [client, eventStatus, eventName, discountType, eventDate, startTime, selectedPack, packs, selectedList, eventType, guests, location, total, transport, delivery, equipment, discountValue, discountAmount, depositPercent, deposit, remaining, budget, contactPerson, contactPhone, eventNotes, internalNotes, clientNotes, attachments]);

  const dateHash = eventDate.split("-").reduce((a, b) => a + parseInt(b, 10), 0);
  const dateAvailable = dateHash % 3 !== 0;

  const state = {
    client, setClient, showClientPanel, setShowClientPanel,
    eventName, setEventName, eventType, setEventType,
    eventDate, setEventDate, startTime, setStartTime, endTime, setEndTime,
    location, setLocation, guests, setGuests, budget, setBudget,
    eventStatus, setEventStatus, contactPerson, setContactPerson, contactPhone, setContactPhone,
    eventNotes, setEventNotes, selectedPack, setSelectedPack,
    selected, setSelected, openCats, setOpenCats,
    transport, setTransport, delivery, setDelivery,
    equipment, setEquipment, extraService, setExtraService,
    discountType, setDiscountType, discountValue, setDiscountValue,
    depositPercent, setDepositPercent, attachments, setAttachments,
    internalNotes, setInternalNotes, clientNotes, setClientNotes,
    tasks, setTasks,
  };

  const showEventForm = selectedEvent !== null;

  const derived = {
    selectedList, itemsSubtotal, extrasTotal, preDiscount,
    discountAmount, total, deposit, remaining, budgetUsed, overBudget,
  };

  const handlers = {
    setQty, setNote, toggleItem, applyPack,
    handleClientChange, handleSelectEvent, handleCreateNewEvent,
  };

  return {
    state, derived, handlers, dateAvailable, packs, menuItems,
    clients: Array.isArray(clients) ? clients : [],
    isClientsLoading: clientsLoading,
    selectedEvent, showEventForm,
    clientEvents: Array.isArray(clientEvents) ? clientEvents : [],
    clientEventsLoading,
    isSubmitting, handleSubmit,
  };
}
