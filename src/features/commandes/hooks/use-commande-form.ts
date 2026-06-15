"use client"

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SelectedItem } from "@/features/commandes/data/mock-data";
import { getCommandeClients } from "@/features/commandes/actions/get-commande-clients";
import { getCommandeMenus } from "@/features/commandes/actions/get-commande-menus";
import { getCommandeAllMenuItems } from "@/features/commandes/actions/get-commande-all-menu-items";
import { getCommandeClientEvents, type ClientEventSummary } from "@/features/commandes/actions/get-commande-client-events";
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
  const [guests, setGuests] = useState(80);
  const [budget, setBudget] = useState(18000);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const [transport, setTransport] = useState(150);
  const [delivery, setDelivery] = useState(80);
  const [equipment, setEquipment] = useState(0);
  const [extraService, setExtraService] = useState(0);

  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);

  const [depositPercent, setDepositPercent] = useState(0);

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

  const EVENT_TYPE_MAP: Record<string, string> = {
    WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
    ANNIVERSARY: "Mariage", HOLIDAY: "Cocktail", OTHER: "Privé",
  };

  const handleClientChange = useCallback((c: Client | null) => {
    setClient(c);
    setSelectedEvent(null);
    if (!c) {
      setEventName(""); setEventType(""); setEventDate(""); setStartTime("");
      setEndTime(""); setLocation(""); setGuests(80); setBudget(0);
      setContactPerson(""); setContactPhone(""); setEventNotes("");
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
  }, []);

  const handleCreateNewEvent = useCallback(() => {
    setSelectedEvent("new");
    setEventName(""); setEventType(""); setEventDate(""); setStartTime("");
    setEndTime(""); setLocation(""); setGuests(80); setBudget(0);
    setContactPerson(""); setContactPhone(""); setEventNotes("");
  }, []);

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
  };
}
