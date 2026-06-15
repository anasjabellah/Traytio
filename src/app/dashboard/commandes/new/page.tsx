"use client"

import { motion, AnimatePresence } from "framer-motion";
import { Lock, StickyNote, Plus } from "lucide-react";
import { useCommandeForm } from "@/features/commandes/hooks/use-commande-form";
import { PageHeader } from "@/features/commandes/components/page-header";
import { StepCard } from "@/features/commandes/components/step-card";
import { ClientStep } from "@/features/commandes/components/client-step";
import { NewClientPanel } from "@/features/commandes/components/new-client-panel";
import { EventStep } from "@/features/commandes/components/event-step";
import { PackStep } from "@/features/commandes/components/pack-step";
import { BuilderStep } from "@/features/commandes/components/builder-step";
import { ExtrasStep } from "@/features/commandes/components/extras-step";
import { DiscountStep } from "@/features/commandes/components/discount-step";
import { DepositStep } from "@/features/commandes/components/deposit-step";
import { AttachmentsStep } from "@/features/commandes/components/attachments-step";
import { TasksStep } from "@/features/commandes/components/tasks-step";
import { EventSelector } from "@/features/commandes/components/event-selector";
import { SummaryPanel } from "@/features/commandes/components/summmary-panel";
import { ActionBar } from "@/features/commandes/components/action-bar";

function NouvelleCommandePage() {
  const form = useCommandeForm();
  const { state, derived, handlers, dateAvailable, packs, menuItems, clients, isClientsLoading, selectedEvent, showEventForm, clientEvents, clientEventsLoading } = form;
  const { client, showClientPanel, setShowClientPanel, eventName, setEventName, eventType, setEventType, eventDate, setEventDate, startTime, setStartTime, endTime, setEndTime, location, setLocation, guests, setGuests, budget, setBudget, contactPerson, setContactPerson, contactPhone, setContactPhone, eventNotes, setEventNotes, selectedPack, setSelectedPack, selected, setSelected, openCats, setOpenCats, transport, setTransport, delivery, setDelivery, equipment, setEquipment, extraService, setExtraService, discountType, setDiscountType, discountValue, setDiscountValue, depositPercent, setDepositPercent, attachments, setAttachments, internalNotes, setInternalNotes, clientNotes, setClientNotes, tasks, setTasks } = state;
  const { selectedList, itemsSubtotal, extrasTotal, discountAmount, total, deposit, remaining, budgetUsed, overBudget } = derived;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative pt-6 pb-44">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-mesh opacity-50 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-6">
          <PageHeader />
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-6">
              <StepCard step={1} title="Client" subtitle="Sélectionnez ou créez un client">
                <ClientStep client={client} setClient={handlers.handleClientChange} onCreate={() => setShowClientPanel(true)} clients={clients} isLoading={isClientsLoading} />
              </StepCard>

              {client && selectedEvent === null && (
                <>
                  {clientEventsLoading ? (
                    <div className="rounded-2xl border border-border bg-surface-soft p-6 flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Chargement des événements...</span>
                    </div>
                  ) : clientEvents.length > 0 ? (
                    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
                      <EventSelector events={clientEvents} onSelect={handlers.handleSelectEvent} onCreateNew={handlers.handleCreateNewEvent} />
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ y: -2 }}
                      onClick={handlers.handleCreateNewEvent}
                      className="w-full rounded-2xl border-2 border-dashed border-border bg-surface-soft p-10 hover:border-gold/40 hover:bg-card transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-8 w-8" />
                      <span className="text-sm font-medium">Créer un nouvel événement</span>
                    </motion.button>
                  )}
                </>
              )}

              {showEventForm && (
                <StepCard step={2} title="Informations de l'événement" subtitle="Tous les détails clés en un coup d'œil">
                  <EventStep eventName={eventName} setEventName={setEventName} eventType={eventType} setEventType={setEventType} eventDate={eventDate} setEventDate={setEventDate} startTime={startTime} setStartTime={setStartTime} endTime={endTime} setEndTime={setEndTime} location={location} setLocation={setLocation} guests={guests} setGuests={setGuests} budget={budget} setBudget={setBudget} contactPerson={contactPerson} setContactPerson={setContactPerson} contactPhone={contactPhone} setContactPhone={setContactPhone} eventNotes={eventNotes} setEventNotes={setEventNotes} dateAvailable={dateAvailable} />
                </StepCard>
              )}
              <StepCard step={3} title="Pack template" subtitle="Optionnel — démarrez plus vite">
                <PackStep packs={packs} selectedPack={selectedPack} onSelect={handlers.applyPack} />
              </StepCard>
              <StepCard step={4} title="Event Builder" subtitle="Composez chaque catégorie de l'événement" highlight>
                <BuilderStep menuItems={menuItems} selected={selected} openCats={openCats} setOpenCats={setOpenCats} setQty={handlers.setQty} setNote={handlers.setNote} toggleItem={handlers.toggleItem} />
              </StepCard>
              <StepCard step={5} title="Frais supplémentaires" subtitle="Transport, location et services">
                <ExtrasStep transport={transport} setTransport={setTransport} delivery={delivery} setDelivery={setDelivery} equipment={equipment} setEquipment={setEquipment} extraService={extraService} setExtraService={setExtraService} />
              </StepCard>
              <StepCard step={6} title="Remise" subtitle="Pourcentage ou montant fixe">
                <DiscountStep discountType={discountType} setDiscountType={setDiscountType} discountValue={discountValue} setDiscountValue={setDiscountValue} />
              </StepCard>
              <StepCard step={7} title="Acompte" subtitle="Calculé sur le total final">
                <DepositStep depositPercent={depositPercent} setDepositPercent={setDepositPercent} total={total} deposit={deposit} remaining={remaining} />
              </StepCard>
              <StepCard step={8} title="Pièces jointes" subtitle="Brief, plan de salle, contrats">
                <AttachmentsStep attachments={attachments} setAttachments={setAttachments} />
              </StepCard>
              <StepCard step={9} title="Notes internes" subtitle="Visible uniquement par votre équipe" icon={<Lock className="h-3.5 w-3.5" />}>
                <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Notes équipe, instructions cuisine, logistique…" className="w-full min-h-[110px] rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none" />
              </StepCard>
              <StepCard step={10} title="Notes client" subtitle="Apparaîtront sur le devis" icon={<StickyNote className="h-3.5 w-3.5" />}>
                <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Mot personnel, conditions, conseils dégustation…" className="w-full min-h-[110px] rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all resize-none" />
              </StepCard>
              <StepCard step={11} title="Tâches" subtitle="Checklist opérationnelle de l'événement">
                <TasksStep tasks={tasks} setTasks={setTasks} />
              </StepCard>
            </div>
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SummaryPanel client={client} eventName={eventName} eventDate={eventDate} guests={guests} packName={packs.find((p) => p.id === selectedPack)?.name} selectedList={selectedList} itemsSubtotal={itemsSubtotal} extrasTotal={extrasTotal} discountAmount={discountAmount} total={total} deposit={deposit} remaining={remaining} budget={budget} budgetUsed={budgetUsed} overBudget={overBudget} />
            </div>
          </div>
        </div>
      </div>
      <ActionBar total={total} />
      <AnimatePresence>
        {showClientPanel && <NewClientPanel onClose={() => setShowClientPanel(false)} onCreate={(c) => { handlers.handleClientChange(c); setShowClientPanel(false); }} />}
      </AnimatePresence>
    </main>
  );
}

export default NouvelleCommandePage;
