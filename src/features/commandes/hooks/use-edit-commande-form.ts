"use client"

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SelectedItem } from "@/features/commandes/data/mock-data";
import { getCommandeClients } from "@/features/commandes/actions/get-commande-clients";
import { getCommandeMenus } from "@/features/commandes/actions/get-commande-menus";
import { getCommandeAllMenuItems } from "@/features/commandes/actions/get-commande-all-menu-items";
import { updateCommande } from "@/features/commandes/actions/update-commande";
import { createCommandeAttachment } from "@/features/commandes/actions/create-commande-attachment";
import { COMMANDE } from "@/lib/notify/messages";
import type { Client, MenuItemDisplay, CommandeWithDetails } from "@/features/commandes/types";

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

export function useEditCommandeForm(commande: CommandeWithDetails) {
  const eventSrc = commande.event;

  const [client, setClient] = useState<Client | null>({
    id: commande.clientId,
    name: commande.clientName ?? commande.client?.name ?? "",
    phone: commande.clientPhone ?? commande.client?.phone ?? undefined,
    email: commande.client?.email ?? undefined,
  } as Client);
  const [showClientPanel, setShowClientPanel] = useState(false);
  const [selectedEvent] = useState<"new">("new");

  const eventDateVal = eventSrc?.startDate ?? commande.eventDate;
  const eventDateStr = eventDateVal
    ? new Date(eventDateVal).toISOString().split("T")[0]
    : "";
  const startTimeStr = eventDateVal
    ? (() => { const d = new Date(eventDateVal); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; })()
    : "";

  const endTimeVal = eventSrc?.endDate;
  const endTimeStr = endTimeVal
    ? (() => { const d = new Date(endTimeVal); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; })()
    : "";

  const [eventName, setEventName] = useState(eventSrc?.name ?? commande.eventName ?? commande.client?.name ?? "");
  const rawEventType = eventSrc?.type ?? commande.eventType;
  const [eventType, setEventType] = useState(rawEventType ? (EVENT_TYPE_MAP[rawEventType] ?? rawEventType) : "");
  const [eventDate, setEventDate] = useState(eventDateStr);
  const [startTime, setStartTime] = useState(startTimeStr);
  const [endTime, setEndTime] = useState(endTimeStr);
  const [location, setLocation] = useState(eventSrc?.location ?? commande.location ?? "");
  const [guests, setGuests] = useState(eventSrc?.guestCount ?? commande.guestCount ?? 10);
  const [budget, setBudget] = useState(eventSrc?.budget ?? commande.clientBudget ?? 0);
  const [eventStatus, setEventStatus] = useState<string | null>(eventSrc?.status ?? null);
  const [contactPerson, setContactPerson] = useState(eventSrc?.contactPerson ?? commande.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(eventSrc?.contactPhone ?? commande.contactPhone ?? "");
  const [eventNotes, setEventNotes] = useState(eventSrc?.notes ?? commande.notes ?? "");

  const [selectedPack, setSelectedPack] = useState<string | null>(commande.menuId);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const [transport, setTransport] = useState(commande.transportFees ?? 0);
  const [delivery, setDelivery] = useState(commande.deliveryFees ?? 0);
  const [equipment, setEquipment] = useState(commande.equipmentFees ?? 0);
  const [extraService, setExtraService] = useState(0);

  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    commande.discountType === "FIXED" ? "fixed" : "percent"
  );
  const [discountValue, setDiscountValue] = useState(commande.discountValue ?? 0);

  const [acompteAmount, setAcompteAmount] = useState(commande.acompteAmount ?? 0);

  const initTasks = (commande.tasks ?? []).map((t, i) => ({
    id: t.id ?? `t${i}`,
    label: t.title,
    done: t.isDone,
  }));
  const [attachments, setAttachments] = useState<any[]>(
    (commande.attachments ?? []).map(a => ({ name: a.name, size: "", url: a.url, type: a.type }))
  );
  const [internalNotes, setInternalNotes] = useState(commande.internalNotes ?? "");
  const [clientNotes, setClientNotes] = useState(commande.clientNotes ?? "");
  const [tasks, setTasks] = useState(initTasks);

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

  useEffect(() => {
    if (!clients || !Array.isArray(clients)) return;
    const found = (clients as Client[]).find(c => c.id === commande.clientId);
    if (found) setClient(found);
    else setClient({ id: commande.clientId, name: commande.clientName ?? "", phone: commande.clientPhone ?? undefined });
  }, [clients, commande.clientId, commande.clientName, commande.clientPhone]);

  useEffect(() => {
    if (!commande.items?.length) return;
    const initialSelected: Record<string, SelectedItem> = {};
    commande.items.forEach(item => {
      const id = item.menuItemId ?? item.name;
      initialSelected[id] = { id, qty: item.quantity, note: item.notes ?? "" };
    });
    setSelected(initialSelected);
  }, [commande.items]);

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
  const deposit = acompteAmount;
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
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return;
    setSelectedPack(packId);
    const next: Record<string, SelectedItem> = {};
    pack.items.forEach((id) => (next[id] = { id, qty: guests }));
    setSelected(next);
  };

  const handleClientChange = useCallback((c: Client | null) => {
    setClient(c);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = useCallback(async () => {
    if (!client) return { success: false as const, error: COMMANDE.NO_CLIENT_SELECTED };
    setIsSubmitting(true);
    try {
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
      const result = await updateCommande(commande.id, {
        number: commande.number,
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
        acomptePercent: total > 0 ? Math.round((deposit / total) * 100) : 0,
        acompteAmount: deposit,
        clientBudget: budget || null,
        contactName: contactPerson || null,
        contactPhone: contactPhone || null,
        notes: eventNotes || null,
        internalNotes: internalNotes || null,
        clientNotes: clientNotes || null,
        status: commande.status as any,
        items,
      });
      if (!result.success) return { success: false as const, error: result.error ?? COMMANDE.UPDATE.ERROR };

      const uploadErrors: string[] = [];
      for (const file of attachments) {
        if (!(file instanceof File)) continue;
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("name", file.name);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => null);
            throw new Error(err?.error || "Upload failed");
          }
          const { url } = await uploadRes.json();
          await createCommandeAttachment(commande.id, file.name, url, file.type);
        } catch {
          uploadErrors.push(file.name);
        }
      }

      return { success: true as const, data: { id: commande.id }, uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined };
    } finally {
      setIsSubmitting(false);
    }
  }, [client, commande.id, commande.number, commande.status, eventStatus, eventName, discountType, eventDate, startTime, selectedPack, packs, selectedList, eventType, guests, location, total, transport, delivery, equipment, discountValue, discountAmount, acompteAmount, deposit, budget, contactPerson, contactPhone, eventNotes, internalNotes, clientNotes, attachments]);

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
    acompteAmount, setAcompteAmount, attachments, setAttachments,
    internalNotes, setInternalNotes, clientNotes, setClientNotes,
    tasks, setTasks,
  };

  const showEventForm = true;

  const derived = {
    selectedList, itemsSubtotal, extrasTotal, preDiscount,
    discountAmount, total, deposit, remaining, budgetUsed, overBudget,
  };

  const handlers = {
    setQty, setNote, toggleItem, applyPack,
    handleClientChange,
    handleSelectEvent: undefined as any,
    handleCreateNewEvent: undefined as any,
  };

  return {
    state, derived, handlers, dateAvailable, packs, menuItems,
    clients: Array.isArray(clients) ? clients : [],
    isClientsLoading: clientsLoading,
    selectedEvent, showEventForm,
    clientEvents: [],
    clientEventsLoading: false,
    isSubmitting, handleSubmit: handleUpdate,
  };
}
