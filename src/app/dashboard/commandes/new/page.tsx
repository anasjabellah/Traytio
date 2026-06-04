"use client"

import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Search, Plus, Minus, Check, X, Sparkles, Calendar, MapPin, Users, Clock, Phone,
  Wallet, Crown, CheckCircle2, AlertTriangle, ChevronDown, Package, Truck, Percent,
  Paperclip, Lock, ListChecks, FileText, Send, Save,
  Upload, Trash2, StickyNote, ArrowLeft,
} from "lucide-react";
import { MENU, PACKS, EVENT_TYPES, type MenuItem, type Cat, type SelectedItem } from "@/features/commandes/data/mock-data";
import { getCommandeClients } from "@/features/commandes/actions/get-commande-clients";
import { useQuery } from "@tanstack/react-query";

// ============================================================================

type Client = any;

const CATEGORIES: { id: Cat; label: string; icon: string }[] = [
  { id: "Food", label: "Plats", icon: "\uD83C\uDF7D\uFE0F" },
  { id: "Drinks", label: "Boissons", icon: "\uD83E\uDD42" },
  { id: "Desserts", label: "Desserts", icon: "\uD83C\uDF70" },
  { id: "Decoration", label: "Décoration", icon: "\uD83D\uDC90" },
  { id: "Extras", label: "Extras", icon: "\u2728" },
];

function useClients() {
  return useQuery({
    queryKey: ["commande-clients"],
    queryFn: () => getCommandeClients(),
  });
}

function NouvelleCommandePage() {
  // ----- state -----
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

  const { data: clients, isLoading: clientsLoading } = useClients();

  // ----- derived -----
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

  // ----- handlers -----
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

  // Fake availability based on date
  const dateHash = eventDate.split("-").reduce((a, b) => a + parseInt(b, 10), 0);
  const dateAvailable = dateHash % 3 !== 0;

  return (
    <main className="min-h-screen bg-background text-foreground">

      <div className="relative pt-6 pb-44">
        {/* Mesh background */}
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-mesh opacity-50 pointer-events-none" />

        <div className="relative mx-auto max-w-[1400px] px-6">
          {/* Page header */}
          <PageHeader />

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            {/* LEFT — Workflow */}
            <div className="space-y-6">
              <StepCard step={1} title="Client" subtitle="Sélectionnez ou créez un client">
                <ClientStep client={client} setClient={setClient} onCreate={() => setShowClientPanel(true)} clients={Array.isArray(clients) ? clients : []} isLoading={clientsLoading} />
              </StepCard>

              <StepCard step={2} title="Informations de l'événement" subtitle="Tous les détails clés en un coup d'œil">
                <EventStep
                  {...{
                    eventName, setEventName, eventType, setEventType, eventDate, setEventDate,
                    startTime, setStartTime, endTime, setEndTime, location, setLocation,
                    guests, setGuests, budget, setBudget, contactPerson, setContactPerson,
                    contactPhone, setContactPhone, eventNotes, setEventNotes, dateAvailable,
                  }}
                />
              </StepCard>

              <StepCard step={3} title="Pack template" subtitle="Optionnel — démarrez plus vite">
                <PackStep selectedPack={selectedPack} onSelect={applyPack} />
              </StepCard>

              <StepCard step={4} title="Event Builder" subtitle="Composez chaque catégorie de l'événement" highlight>
                <BuilderStep
                  selected={selected}
                  openCats={openCats}
                  setOpenCats={setOpenCats}
                  setQty={setQty}
                  setNote={setNote}
                  toggleItem={toggleItem}
                />
              </StepCard>

              <StepCard step={5} title="Frais supplémentaires" subtitle="Transport, location et services">
                <ExtrasStep {...{ transport, setTransport, delivery, setDelivery, equipment, setEquipment, extraService, setExtraService }} />
              </StepCard>

              <StepCard step={6} title="Remise" subtitle="Pourcentage ou montant fixe">
                <DiscountStep {...{ discountType, setDiscountType, discountValue, setDiscountValue }} />
              </StepCard>

              <StepCard step={7} title="Acompte" subtitle="Calculé sur le total final">
                <DepositStep {...{ depositPercent, setDepositPercent, total, deposit, remaining }} />
              </StepCard>

              <StepCard step={8} title="Pièces jointes" subtitle="Brief, plan de salle, contrats">
                <AttachmentsStep attachments={attachments} setAttachments={setAttachments} />
              </StepCard>

              <StepCard step={9} title="Notes internes" subtitle="Visible uniquement par votre équipe" icon={<Lock className="h-3.5 w-3.5" />}>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes équipe, instructions cuisine, logistique…"
                  className="w-full min-h-[110px] rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
                />
              </StepCard>

              <StepCard step={10} title="Notes client" subtitle="Apparaîtront sur le devis" icon={<StickyNote className="h-3.5 w-3.5" />}>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Mot personnel, conditions, conseils dégustation…"
                  className="w-full min-h-[110px] rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none"
                />
              </StepCard>

              <StepCard step={11} title="Tâches" subtitle="Checklist opérationnelle de l'événement">
                <TasksStep tasks={tasks} setTasks={setTasks} />
              </StepCard>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SummaryPanel
                client={client}
                eventName={eventName}
                eventDate={eventDate}
                guests={guests}
                packName={PACKS.find((p) => p.id === selectedPack)?.name}
                selectedList={selectedList}
                itemsSubtotal={itemsSubtotal}
                extrasTotal={extrasTotal}
                discountAmount={discountAmount}
                total={total}
                deposit={deposit}
                remaining={remaining}
                budget={budget}
                budgetUsed={budgetUsed}
                overBudget={overBudget}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <ActionBar total={total} />

      {/* Slide-over for new client */}
      <AnimatePresence>
        {showClientPanel && (
          <NewClientPanel
            onClose={() => setShowClientPanel(false)}
            onCreate={(c) => {
              setClient(c);
              setShowClientPanel(false);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default NouvelleCommandePage;

// ============================================================================
// Page header
// ============================================================================

function PageHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <button className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour aux commandes
        </button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-gold-deep" /> Event Builder
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">Brouillon · enregistré il y a 2s</div>
        </div>
        <h1 className="mt-3 font-display text-5xl lg:text-6xl tracking-tight">
          Nouvelle <span className="italic text-gradient-gold">commande</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Composez l'événement complet — du client au devis — dans un seul flux orchestré.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Step shell
// ============================================================================

function StepCard({
  step, title, subtitle, children, highlight, icon,
}: {
  step: number; title: string; subtitle?: string; children: React.ReactNode; highlight?: boolean; icon?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-[1.75rem] border bg-card p-7 transition-shadow ${
        highlight ? "border-gold shadow-gold" : "border-border/70 shadow-soft hover:shadow-lift"
      }`}
    >
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-medium tabular-nums ${
            highlight ? "bg-gradient-gold text-gold-foreground" : "bg-foreground text-primary-foreground"
          }`}>
            {String(step).padStart(2, "0")}
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-tight flex items-center gap-2">
              {title}
              {icon && <span className="text-muted-foreground">{icon}</span>}
            </h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </header>
      {children}
    </motion.section>
  );
}

// ============================================================================
// Step 1 — Client
// ============================================================================

function ClientStep({ client, setClient, onCreate, clients, isLoading }: { client: Client; setClient: (c: Client) => void; onCreate: () => void; clients: any[]; isLoading: boolean; }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft px-4 py-3.5">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="text-sm text-muted-foreground">Chargement des clients...</span>
      </div>
    );
  }

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone?.includes(query) || c.email?.toLowerCase().includes(query.toLowerCase()));
  const showResults = focused && !client && (query.length > 0 || true);

  if (client) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-gold/40 bg-gradient-to-br from-gold-soft/40 to-transparent p-5"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-charcoal text-primary-foreground flex items-center justify-center font-display text-xl">
            {client.name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">{client.name}</div>
              {client.vip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
                  <Crown className="h-2.5 w-2.5" /> VIP
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{client.email} · {client.phone}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{client._count?.events || 0} événements à ce jour</div>
          </div>
        </div>
        <button onClick={() => setClient(null)} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className={`flex items-center gap-3 rounded-2xl border bg-surface-soft px-4 transition-all ${focused ? "border-gold ring-gold" : "border-border"}`}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Rechercher un client par nom, téléphone, email…"
            className="flex-1 bg-transparent py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs font-medium hover:shadow-gold transition-all"
          >
            <Plus className="h-3 w-3" /> Nouveau client
          </button>
        </div>

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-10 left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-lift overflow-hidden"
            >
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-soft border-b border-border">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </div>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => setClient(c)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-soft transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                      {c.name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {c.name}
                        {c.vip && <Crown className="h-3 w-3 text-gold-deep" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.phone}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{c._count?.events || 0} évts</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Aucun client trouvé · <button onMouseDown={onCreate} className="text-foreground underline">Créer "{query}"</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NewClientPanel({ onClose, onCreate }: { onClose: () => void; onCreate: (c: NonNullable<Client>) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [vip, setVip] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 right-0 bottom-0 z-[61] w-full max-w-md bg-background border-l border-border shadow-lift flex flex-col"
      >
        <header className="flex items-center justify-between px-7 py-6 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Nouveau</div>
            <h3 className="font-display text-3xl">Créer un client</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-7 py-6 space-y-4">
          <PremiumField label="Nom" value={name} onChange={setName} placeholder="Sophie Lambert" />
          <PremiumField label="Téléphone" value={phone} onChange={setPhone} placeholder="+33 6 12 34 56 78" />
          <PremiumField label="Email" value={email} onChange={setEmail} placeholder="sophie@lambert.fr" />
          <PremiumField label="Adresse" value={address} onChange={setAddress} placeholder="12 rue de Rivoli, Paris" />
          <PremiumField label="Notes" value={notes} onChange={setNotes} placeholder="Préférences, allergies…" multiline />
          <label className="flex items-center justify-between rounded-2xl border border-border bg-surface-soft px-4 py-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 text-gold-deep" />
              <div>
                <div className="text-sm font-medium">Client VIP</div>
                <div className="text-xs text-muted-foreground">Mis en avant dans toutes les listes</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVip(!vip)}
              className={`relative h-6 w-11 rounded-full transition-colors ${vip ? "bg-gradient-gold" : "bg-border"}`}
            >
              <motion.span
                animate={{ x: vip ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
              />
            </button>
          </label>
        </div>
        <footer className="px-7 py-5 border-t border-border flex items-center gap-3 bg-surface-soft">
          <button onClick={onClose} className="flex-1 rounded-full border border-border bg-card py-3 text-sm hover:bg-secondary transition">
            Annuler
          </button>
          <button
            onClick={() =>
              onCreate({
                id: "new-" + Date.now(),
                name: name || "Nouveau client",
                phone, email, vip, events: 0,
              })
            }
            className="flex-1 rounded-full bg-foreground text-primary-foreground py-3 text-sm font-medium hover:shadow-gold transition-all inline-flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" /> Créer le client
          </button>
        </footer>
      </motion.div>
    </>
  );
}

function PremiumField({
  label, value, onChange, placeholder, multiline, type = "text", icon, prefix, suffix,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string; icon?: React.ReactNode;
  prefix?: string; suffix?: string;
}) {
  return (
    <label className="block group">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        {multiline ? (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm min-h-[80px] focus:outline-none resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        )}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

// ============================================================================
// Step 2 — Event
// ============================================================================

function EventStep(props: any) {
  const {
    eventName, setEventName, eventType, setEventType, eventDate, setEventDate,
    startTime, setStartTime, endTime, setEndTime, location, setLocation,
    guests, setGuests, budget, setBudget, contactPerson, setContactPerson,
    contactPhone, setContactPhone, eventNotes, setEventNotes, dateAvailable,
  } = props;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <PremiumField label="Nom de l'événement" value={eventName} onChange={setEventName} placeholder="Mariage Lambert" />
        <label className="block">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Type d'événement</div>
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface-soft p-1.5">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setEventType(t)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${eventType === t ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <PremiumField label="Date" value={eventDate} onChange={setEventDate} type="date" icon={<Calendar className="h-4 w-4" />} />
        <PremiumField label="Début" value={startTime} onChange={setStartTime} type="time" icon={<Clock className="h-4 w-4" />} />
        <PremiumField label="Fin" value={endTime} onChange={setEndTime} type="time" icon={<Clock className="h-4 w-4" />} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dateAvailable ? "ok" : "warn"}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            dateAvailable ? "border-emerald-200 bg-emerald-50/50" : "border-amber-300 bg-amber-50/60"
          }`}
        >
          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
            dateAvailable ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          }`}>
            {dateAvailable ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-sm font-medium">
              {dateAvailable ? "Date disponible" : "2 événements déjà programmés ce jour"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {dateAvailable
                ? "Aucun conflit dans votre planning équipe & logistique."
                : "Vérifiez la disponibilité de votre équipe avant confirmation."}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <PremiumField label="Lieu" value={location} onChange={setLocation} placeholder="Adresse, salle, château…" icon={<MapPin className="h-4 w-4" />} />

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nombre d'invités</div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-soft px-4 py-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <button onClick={() => setGuests(Math.max(1, guests - 10))} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <motion.span key={guests} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl tabular-nums">
              {guests}
            </motion.span>
            <button onClick={() => setGuests(guests + 10)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">pax</span>
          </div>
        </label>
        <PremiumField label="Budget client" value={budget} onChange={(v) => setBudget(parseInt(v) || 0)} type="number" prefix="MAD" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PremiumField label="Personne de contact" value={contactPerson} onChange={setContactPerson} placeholder="Nom du contact sur place" />
        <PremiumField label="Téléphone contact" value={contactPhone} onChange={setContactPhone} placeholder="+33 6 …" icon={<Phone className="h-4 w-4" />} />
      </div>

      <PremiumField label="Notes" value={eventNotes} onChange={setEventNotes} placeholder="Détails logistiques, demandes spéciales…" multiline />
    </div>
  );
}

// ============================================================================
// Step 3 — Pack
// ============================================================================

function PackStep({ selectedPack, onSelect }: { selectedPack: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {PACKS.map((p) => {
        const active = selectedPack === p.id;
        return (
          <motion.button
            key={p.id}
            whileHover={{ y: -3 }}
            onClick={() => onSelect(p.id)}
            className={`relative text-left rounded-2xl border p-5 transition-all overflow-hidden ${
              active ? "border-gold shadow-gold bg-gradient-to-br from-gold-soft/60 to-transparent" : "border-border bg-card hover:shadow-lift"
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${p.accent} opacity-60`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-gold-deep" />
                {active && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
                    <Check className="h-2.5 w-2.5" /> Appliqué
                  </motion.span>
                )}
              </div>
              <div className="mt-10 font-display text-2xl">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.subtitle}</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">à partir de</div>
                  <div className="font-display text-xl tabular-nums">{p.price} MAD<span className="text-xs text-muted-foreground"> / pers</span></div>
                </div>
                <div className="text-[11px] text-muted-foreground">{p.items.length} items</div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Step 4 — Builder
// ============================================================================

function BuilderStep({
  selected, openCats, setOpenCats, setQty, setNote, toggleItem,
}: {
  selected: Record<string, SelectedItem>;
  openCats: Record<Cat, boolean>;
  setOpenCats: (v: Record<Cat, boolean>) => void;
  setQty: (id: string, q: number) => void;
  setNote: (id: string, n: string) => void;
  toggleItem: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <LayoutGroup>
        {CATEGORIES.map((cat) => {
          const items = MENU.filter((m) => m.category === cat.id);
          const count = items.filter((i) => (selected[i.id]?.qty || 0) > 0).length;
          const isOpen = openCats[cat.id];
          return (
            <motion.div layout key={cat.id} className="rounded-2xl border border-border bg-surface-soft overflow-hidden">
              <button
                onClick={() => setOpenCats({ ...openCats, [cat.id]: !isOpen })}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="text-left">
                    <div className="font-display text-xl">{cat.label}</div>
                    <div className="text-[11px] text-muted-foreground">{items.length} produits disponibles</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-2.5 py-0.5 text-[10px] font-medium">
                      {count} sélectionné{count > 1 ? "s" : ""}
                    </span>
                  )}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.span>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="p-4 grid sm:grid-cols-2 gap-3 bg-card border-t border-border">
                      {items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          state={selected[item.id]}
                          onToggle={() => toggleItem(item.id)}
                          onQty={(n) => setQty(item.id, n)}
                          onNote={(n) => setNote(item.id, n)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

function ItemCard({
  item, state, onToggle, onQty, onNote,
}: {
  item: MenuItem; state?: SelectedItem;
  onToggle: () => void; onQty: (n: number) => void; onNote: (n: string) => void;
}) {
  const qty = state?.qty || 0;
  const active = qty > 0;
  const [showNote, setShowNote] = useState(false);
  const lineTotal = item.price * qty;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border p-4 transition-all ${
        active
          ? "border-gold bg-gradient-to-br from-gold-soft/40 to-transparent shadow-soft"
          : "border-border bg-card hover:border-foreground/20 hover:shadow-soft"
      }`}
    >
      {item.tag && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-gold text-gold-foreground px-2 py-0.5 text-[10px] font-medium">
          {item.tag}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-3xl">
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</div>
          <div className="text-xs text-muted-foreground mt-1.5 tabular-nums">{item.price} MAD · unité</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key="qty"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card p-0.5"
            >
              <button onClick={() => onQty(qty - 5)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <Minus className="h-3 w-3" />
              </button>
              <motion.span key={qty} initial={{ y: -2, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-xs font-medium w-10 text-center tabular-nums">
                {qty}
              </motion.span>
              <button onClick={() => onQty(qty + 5)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs"
            >
              <Plus className="h-3 w-3" /> Ajouter
            </motion.button>
          )}
        </AnimatePresence>
        {active && (
          <motion.div key={lineTotal} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-lg tabular-nums">
            {lineTotal.toLocaleString("fr-MA")} MAD
          </motion.div>
        )}
      </div>

      {active && (
        <motion.div layout className="mt-3 pt-3 border-t border-border/60">
          <button
            onClick={() => setShowNote(!showNote)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <StickyNote className="h-3 w-3" /> {state?.note ? "Modifier la note" : "Ajouter une note spéciale"}
          </button>
          <AnimatePresence>
            {showNote && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                value={state?.note || ""}
                onChange={(e) => onNote(e.target.value)}
                placeholder="Sans amandes, dressage VIP…"
                className="mt-2 w-full rounded-xl border border-border bg-surface-soft px-3 py-2 text-xs focus:outline-none focus:border-gold"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Step 5 — Extras
// ============================================================================

function ExtrasStep(props: any) {
  const { transport, setTransport, delivery, setDelivery, equipment, setEquipment, extraService, setExtraService } = props;
  const items = [
    { label: "Transport", icon: <Truck className="h-4 w-4" />, value: transport, set: setTransport },
    { label: "Livraison", icon: <Package className="h-4 w-4" />, value: delivery, set: setDelivery },
    { label: "Location équipement", icon: <Package className="h-4 w-4" />, value: equipment, set: setEquipment },
    { label: "Services extra", icon: <Sparkles className="h-4 w-4" />, value: extraService, set: setExtraService },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((it) => (
        <PremiumField key={it.label} label={it.label} value={it.value} onChange={(v) => it.set(parseInt(v) || 0)} type="number" prefix="MAD" icon={it.icon} />
      ))}
    </div>
  );
}

// ============================================================================
// Step 6 — Discount
// ============================================================================

function DiscountStep({ discountType, setDiscountType, discountValue, setDiscountValue }: any) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex gap-1 rounded-full border border-border bg-surface-soft p-1 self-start">
        {[
          { id: "percent", label: "Pourcentage", icon: <Percent className="h-3.5 w-3.5" /> },
          { id: "fixed", label: "Montant fixe", icon: <span className="text-xs">MAD</span> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setDiscountType(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all ${
              discountType === t.id ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <PremiumField
          label="Valeur de remise"
          value={discountValue}
          onChange={(v) => setDiscountValue(parseFloat(v) || 0)}
          type="number"
          suffix={discountType === "percent" ? "%" : "MAD"}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Step 7 — Deposit
// ============================================================================

function DepositStep({ depositPercent, setDepositPercent, total, deposit, remaining }: any) {
  const presets = [20, 30, 50, 100];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mr-2">Acompte</div>
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setDepositPercent(p)}
            className={`px-3 py-1.5 rounded-full text-xs transition ${
              depositPercent === p ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}%
          </button>
        ))}
        <input
          type="number"
          value={depositPercent}
          onChange={(e) => setDepositPercent(parseInt(e.target.value) || 0)}
          className="w-20 rounded-full border border-border bg-surface-soft px-3 py-1.5 text-xs text-center focus:outline-none focus:border-gold"
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <FinancialCard label="Total" value={total} />
        <FinancialCard label={`Acompte ${depositPercent}%`} value={deposit} highlight />
        <FinancialCard label="Solde restant" value={remaining} muted />
      </div>
    </div>
  );
}

function FinancialCard({ label, value, highlight, muted }: { label: string; value: number; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${
      highlight
        ? "bg-gradient-to-br from-gold-soft/60 to-transparent border border-gold/40 shadow-gold"
        : muted
        ? "bg-surface-soft border border-border"
        : "bg-card border border-border"
    }`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <motion.div key={value} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-2 font-display text-3xl tabular-nums">
        {value.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD
      </motion.div>
    </div>
  );
}

// ============================================================================
// Step 8 — Attachments
// ============================================================================

function AttachmentsStep({ attachments, setAttachments }: { attachments: any[]; setAttachments: (a: any[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f) => ({ name: f.name, size: `${Math.round(f.size / 1024)} KB` }));
    setAttachments([...attachments, ...next]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          drag ? "border-gold bg-gold-soft/30" : "border-border bg-surface-soft hover:border-foreground/30"
        }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <div className="mx-auto h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center mb-3">
          <Upload className="h-5 w-5 text-gold-deep" />
        </div>
        <div className="text-sm font-medium">Glissez vos fichiers ici</div>
        <div className="text-xs text-muted-foreground mt-1">Images, PDF, documents — jusqu'à 20 MB</div>
      </div>
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a, i) => (
            <motion.div
              key={a.name + i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-soft border border-border flex items-center justify-center">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">{a.size}</div>
                </div>
              </div>
              <button
                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step 11 — Tasks
// ============================================================================

function TasksStep({ tasks, setTasks }: { tasks: any[]; setTasks: (t: any[]) => void }) {
  const [newTask, setNewTask] = useState("");
  const toggle = (id: string) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const add = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: "t" + Date.now(), label: newTask, done: false }]);
    setNewTask("");
  };
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground tabular-nums">{done} / {tasks.length} terminées</div>
        <div className="h-1 w-32 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
            className="h-full bg-gradient-gold"
          />
        </div>
      </div>
      <LayoutGroup>
        {tasks.map((t) => (
          <motion.div
            layout
            key={t.id}
            className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
              t.done ? "border-border bg-surface-soft" : "border-border bg-card hover:border-foreground/20"
            }`}
          >
            <button
              onClick={() => toggle(t.id)}
              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                t.done ? "bg-gradient-gold border-gold text-gold-foreground" : "border-border hover:border-foreground"
              }`}
            >
              <AnimatePresence>
                {t.done && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <span className={`flex-1 text-sm transition-all ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.label}</span>
            <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </LayoutGroup>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-2">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ajouter une tâche…"
          className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
        />
        <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs">
          <Plus className="h-3 w-3" /> Ajouter
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Summary panel
// ============================================================================

function SummaryPanel(props: {
  client: Client; eventName: string; eventDate: string; guests: number;
  packName?: string; selectedList: any[]; itemsSubtotal: number; extrasTotal: number;
  discountAmount: number; total: number; deposit: number; remaining: number;
  budget: number; budgetUsed: number; overBudget: boolean;
}) {
  const {
    client, eventName, eventDate, guests, packName, selectedList,
    itemsSubtotal, extrasTotal, discountAmount, total, deposit, remaining,
    budget, budgetUsed, overBudget,
  } = props;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[1.75rem] glass shadow-glass overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-mesh opacity-50 pointer-events-none" />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Résumé en direct</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        </div>

        <div className="mt-3 font-display text-2xl leading-tight">{eventName || "Nouvel événement"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {client?.name || "Aucun client"} · {new Date(eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {guests} pax
        </div>
        {packName && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-gold text-gold-foreground px-2.5 py-0.5 text-[10px] font-medium">
            <Package className="h-2.5 w-2.5" /> {packName}
          </div>
        )}

        {/* Items list */}
        <div className="mt-5 max-h-[200px] overflow-auto pr-1 space-y-1.5">
          <AnimatePresence>
            {selectedList.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">Aucun article sélectionné.</div>
            )}
            {selectedList.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{s.item.emoji}</span>
                  <span className="truncate">{s.item.name}</span>
                  <span className="text-muted-foreground tabular-nums">×{s.qty}</span>
                </div>
                <span className="tabular-nums">{(s.item.price * s.qty).toLocaleString("fr-MA")} MAD</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-5 pt-5 border-t border-border space-y-2 text-xs">
          <Row label="Articles" value={itemsSubtotal} />
          <Row label="Frais supplémentaires" value={extrasTotal} />
          {discountAmount > 0 && <Row label="Remise" value={-discountAmount} accent="text-emerald-700" />}
          <div className="flex items-end justify-between pt-3">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total</span>
            <motion.span key={total} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-3xl tabular-nums">
              {total.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD
            </motion.span>
          </div>
          <Row label="Acompte" value={deposit} muted />
          <Row label="Solde restant" value={remaining} muted />
        </div>

        {/* Budget */}
        {budget > 0 && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Budget client</div>
              <div className="tabular-nums">{total.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD / {budget.toLocaleString("fr-MA")} MAD</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${budgetUsed}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={`h-full ${overBudget ? "bg-destructive" : "bg-gradient-gold"}`}
              />
            </div>
            <div className={`mt-2 text-[11px] ${overBudget ? "text-destructive" : "text-muted-foreground"}`}>
              {overBudget
                ? `Dépassement de ${(total - budget).toLocaleString("fr-MA")} MAD`
                : `Reste ${(budget - total).toLocaleString("fr-MA")} MAD sur le budget`}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: number; muted?: boolean; accent?: string }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""} ${accent || ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD</span>
    </div>
  );
}

// ============================================================================
// Sticky action bar
// ============================================================================

function ActionBar({ total }: { total: number }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[min(1180px,calc(100%-2rem))]"
    >
      <div className="glass shadow-glass rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-gradient-charcoal text-primary-foreground flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total commande</div>
            <motion.div key={total} initial={{ y: -2, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-xl tabular-nums leading-tight">
              {total.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} MAD
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <BarBtn icon={<Save className="h-3.5 w-3.5" />} label="Brouillon" ghost />
          <BarBtn icon={<FileText className="h-3.5 w-3.5" />} label="Devis" />
          <BarBtn icon={<Send className="h-3.5 w-3.5" />} label="WhatsApp" ghost />
          <BarBtn icon={<Check className="h-3.5 w-3.5" />} label="Créer la commande" primary />
        </div>
      </div>
    </motion.div>
  );
}

function BarBtn({ icon, label, primary, ghost }: { icon: React.ReactNode; label: string; primary?: boolean; ghost?: boolean }) {
  return (
    <button className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
      primary
        ? "bg-gradient-gold text-gold-foreground hover:shadow-gold"
        : ghost
        ? "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        : "bg-foreground text-primary-foreground hover:shadow-gold"
    }`}>
      {icon} <span className="hidden md:inline">{label}</span>
    </button>
  );
}