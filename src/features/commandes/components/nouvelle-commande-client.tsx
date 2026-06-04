"use client"

import React, { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, X, Plus, Minus, Package, ShoppingCart, User, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { generateCommandeNumber } from "@/features/commandes/actions/create-commande"

type ClientItem = { id: string; name: string; email: string | null; phone: string | null }
type MenuItemData = {
  id: string; name: string; category: string
  unitPrice: number; unit: string | null; imageUrl: string | null
}
type MenuPack = {
  id: string; name: string; category: string
  pricePerPerson: number; minPersons: number
  menuItems: { menuItemId: string; defaultQty: number; menuItem: { id: string; name: string } }[]
}

type Props = {
  clients: ClientItem[]
  menuItems: MenuItemData[]
  menus: MenuPack[]
}

const EVENT_TYPES = ["Mariage", "Corporate", "Anniversaire", "Cocktail", "Autre"]

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    FOOD: "\uD83C\uDF7D\uFE0F",
    DRINKS: "\uD83E\uDD42",
    DESSERTS: "\uD83C\uDF70",
    DECORATION: "\uD83D\uDC90",
    STAFF: "\uD83D\uDC68\u200D\uD83C\uDF73",
    ENTERTAINMENT: "\uD83C\uDFB5",
    EXTRAS: "\u2728",
  }
  return map[category] ?? "\uD83D\uDCE6"
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    FOOD: "Aliment",
    DRINKS: "Boisson",
    DESSERTS: "Dessert",
    DECORATION: "Décoration",
    STAFF: "Personnel",
    ENTERTAINMENT: "Divertissement",
    EXTRAS: "Extras",
  }
  return map[category] ?? category
}

const steps = [
  { id: "client", label: "Client", icon: User },
  { id: "event", label: "Événement", icon: Calendar },
  { id: "pack", label: "Menu / Pack", icon: Package },
  { id: "items", label: "Articles", icon: ShoppingCart },
  { id: "review", label: "Récapitulatif", icon: Check },
]

export default function NouvelleCommandeClient({ clients, menuItems, menus }: Props) {
  const [step, setStep] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [selectedPackId, setSelectedPackId] = useState("")
  const [eventType, setEventType] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [guestCount, setGuestCount] = useState(30)
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [customItems, setCustomItems] = useState<{ id: string; name: string; category: string; price: number; unit: string; qty: number }[]>([])
  const [creating, setCreating] = useState(false)

  const itemCategoryOrder = ["FOOD", "DRINKS", "DESSERTS", "DECORATION", "STAFF", "ENTERTAINMENT", "EXTRAS"]

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients
    const q = clientSearch.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
  }, [clients, clientSearch])

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedPack = menus.find(m => m.id === selectedPackId)

  const packItems = useMemo(() => {
    if (!selectedPack) return []
    return selectedPack.menuItems.map(mi => {
      const item = menuItems.find(i => i.id === mi.menuItemId)
      return {
        id: mi.menuItemId,
        name: item?.name ?? mi.menuItem.name,
        category: item?.category ?? "",
        price: item ? Number(item.unitPrice) : 0,
        unit: item?.unit ?? "unité",
        qty: mi.defaultQty,
        emoji: getCategoryEmoji(item?.category ?? ""),
      }
    })
  }, [selectedPack, menuItems])

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItemData[]> = {}
    for (const cat of itemCategoryOrder) {
      const items = menuItems.filter(i => i.category === cat)
      if (items.length) groups[cat] = items
    }
    return groups
  }, [menuItems])

  const addCustomItem = useCallback((item: MenuItemData) => {
    setCustomItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { id: item.id, name: item.name, category: item.category, price: Number(item.unitPrice), unit: item.unit ?? "unité", qty: 1 }]
    })
  }, [])

  const updateItemQty = useCallback((id: string, delta: number) => {
    setCustomItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }, [])

  const itemsTotal = useMemo(() => {
    const packTotal = packItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    const customTotal = customItems.reduce((sum, i) => sum + i.price * i.qty, 0)
    return packTotal + customTotal
  }, [packItems, customItems])

  const totalWithGuests = guestCount > 0 && selectedPack
    ? itemsTotal + Number(selectedPack.pricePerPerson) * guestCount
    : itemsTotal

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return !!selectedClientId
      case 1: return !!eventType && guestCount > 0
      case 2: return true
      case 3: return customItems.length > 0 || !!selectedPackId
      case 4: return true
      default: return true
    }
  }, [step, selectedClientId, eventType, guestCount, customItems.length, selectedPackId])

  const handleNext = () => {
    if (step < steps.length - 1 && canNext) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const number = await generateCommandeNumber()

      // Build items payload
      const allItems = [
        ...packItems.map(i => ({
          name: i.name,
          quantity: i.qty,
          unitPrice: i.price,
          totalPrice: i.price * i.qty,
          menuItemId: i.id,
        })),
        ...customItems.map(i => ({
          name: i.name,
          quantity: i.qty,
          unitPrice: i.price,
          totalPrice: i.price * i.qty,
          menuItemId: i.id,
        })),
      ]

      const body = {
        number,
        clientId: selectedClientId,
        eventType,
        eventDate: eventDate || null,
        guestCount,
        location: location || null,
        menuId: selectedPackId || null,
        menuName: selectedPack?.name || null,
        pricePerPerson: selectedPack ? Number(selectedPack.pricePerPerson) : null,
        totalAmount: totalWithGuests,
        notes: notes || null,
        status: "DRAFT",
        items: allItems,
      }

      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? "Erreur lors de la création")
      }

      const commande = await res.json()
      window.location.href = `/dashboard/commandes/${commande.id}`
    } catch (e) {
      console.error("Create commande failed", e)
      alert("Erreur lors de la création de la commande")
    } finally {
      setCreating(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sélectionner un client</h3>
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              className="w-full h-11 text-sm px-4 border border-[#e2e2e2] rounded-xl bg-white outline-none focus:border-[#C9A96E] transition-colors"
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredClients.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedClientId === c.id
                      ? "border-[#C9A96E] bg-[#C9A96E]/5"
                      : "border-[#e2e2e2] hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun client trouvé</p>
              )}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails de l'événement</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Type d'événement *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EVENT_TYPES.map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setEventType(t)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      eventType === t
                        ? "border-[#C9A96E] bg-[#C9A96E]/5 text-[#C9A96E]"
                        : "border-[#e2e2e2] hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date de l'événement</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full h-11 text-sm px-4 border border-[#e2e2e2] rounded-xl bg-white outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre d'invités *</label>
                <input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={e => setGuestCount(Number(e.target.value))}
                  className="w-full h-11 text-sm px-4 border border-[#e2e2e2] rounded-xl bg-white outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lieu</label>
              <input
                type="text"
                placeholder="Adresse ou nom du lieu"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full h-11 text-sm px-4 border border-[#e2e2e2] rounded-xl bg-white outline-none focus:border-[#C9A96E] transition-colors"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choisir un menu / pack</h3>
            <p className="text-sm text-gray-500">Sélectionnez un pack prédéfini ou passez cette étape pour choisir des articles individuellement.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedPackId("")}
                className={`p-4 rounded-xl border text-center transition-colors ${
                  !selectedPackId
                    ? "border-[#C9A96E] bg-[#C9A96E]/5"
                    : "border-[#e2e2e2] hover:border-gray-300"
                }`}
              >
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="font-medium text-sm">Sans pack</p>
                <p className="text-xs text-gray-500 mt-1">Choisir les articles un par un</p>
              </button>
              {menus.map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedPackId(m.id)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    selectedPackId === m.id
                      ? "border-[#C9A96E] bg-[#C9A96E]/5"
                      : "border-[#e2e2e2] hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(m.pricePerPerson)} / pers. &middot; min. {m.minPersons} pers.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {m.menuItems.length} article{m.menuItems.length > 1 ? "s" : ""} inclus
                  </p>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Articles personnalisés</h3>
            {selectedPack && (
              <div className="p-3 bg-gray-50 rounded-xl border border-[#e2e2e2]">
                <p className="text-sm font-medium">Pack sélectionné : {selectedPack.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(selectedPack.pricePerPerson)} / pers.</p>
              </div>
            )}

            {customItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Articles ajoutés ({customItems.length})</p>
                {customItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border border-[#e2e2e2] rounded-xl bg-white">
                    <span className="text-lg">{getCategoryEmoji(item.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{getCategoryLabel(item.category)} &middot; {formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateItemQty(item.id, -1)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                      <button type="button" onClick={() => updateItemQty(item.id, 1)} className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Ajouter des articles</p>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {itemCategoryOrder.map(cat => {
                  const items = groupedItems[cat]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 mt-3 first:mt-0">
                        {getCategoryLabel(cat)}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.map(item => {
                          const alreadyAdded = customItems.some(i => i.id === item.id)
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => addCustomItem(item)}
                              disabled={alreadyAdded}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                                alreadyAdded
                                  ? "border-green-200 bg-green-50 opacity-60"
                                  : "border-[#e2e2e2] hover:border-[#C9A96E]"
                              }`}
                            >
                              <span className="text-lg shrink-0">{getCategoryEmoji(item.category)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)}{item.unit ? ` / ${item.unit}` : ""}</p>
                              </div>
                              {alreadyAdded ? (
                                <Check size={16} className="text-green-600 shrink-0" />
                              ) : (
                                <Plus size={16} className="text-gray-400 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Récapitulatif de la commande</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#e2e2e2] rounded-xl bg-white">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Client</p>
                <p className="font-medium">{selectedClient?.name}</p>
                {selectedClient?.email && <p className="text-sm text-gray-500">{selectedClient.email}</p>}
              </div>
              <div className="p-4 border border-[#e2e2e2] rounded-xl bg-white">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Événement</p>
                <p className="font-medium">{eventType}</p>
                {eventDate && <p className="text-sm text-gray-500">Le {new Date(eventDate).toLocaleDateString("fr-FR")}</p>}
                <p className="text-sm text-gray-500">{guestCount} invité{guestCount > 1 ? "s" : ""}</p>
                {location && <p className="text-sm text-gray-500">{location}</p>}
              </div>
            </div>

            {selectedPack && (
              <div className="p-4 border border-[#e2e2e2] rounded-xl bg-white">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Menu / Pack</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{selectedPack.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedPack.pricePerPerson)} / pers.</p>
                </div>
              </div>
            )}

            {(packItems.length > 0 || customItems.length > 0) && (
              <div className="p-4 border border-[#e2e2e2] rounded-xl bg-white">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Articles</p>
                <div className="space-y-2">
                  {[...packItems, ...customItems].map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{getCategoryEmoji(item.category)}</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-medium shrink-0 ml-2">
                        {item.qty} &times; {formatCurrency(item.price)} = {formatCurrency(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border border-[#C9A96E] rounded-xl bg-[#C9A96E]/5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total estimé</p>
                <p className="text-xl font-bold text-[#C9A96E]">{formatCurrency(totalWithGuests)}</p>
              </div>
              {selectedPack && guestCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Dont {formatCurrency(Number(selectedPack.pricePerPerson) * guestCount)} pour le pack ({formatCurrency(selectedPack.pricePerPerson)} &times; {guestCount} pers.)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                placeholder="Notes ou instructions spéciales..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full text-sm px-4 py-3 border border-[#e2e2e2] rounded-xl bg-white outline-none focus:border-[#C9A96E] transition-colors resize-none"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const currentStep = steps[step]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative pt-6 pb-44">
        <div className="mx-auto max-w-4xl px-6">
          {/* Step indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => {
                const Icon = s.icon
                const isActive = i === step
                const isDone = i < step
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isDone
                            ? "bg-[#C9A96E] text-white"
                            : isActive
                              ? "bg-[#C9A96E]/10 border-2 border-[#C9A96E] text-[#C9A96E]"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isDone ? <Check size={16} /> : <Icon size={16} />}
                      </div>
                      <span className={`text-xs mt-1 hidden md:block ${isActive || isDone ? "text-[#C9A96E] font-medium" : "text-gray-400"}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-[#C9A96E]" : "bg-gray-200"}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {currentStep.label}
            </h2>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-[0.75rem] border border-[#e2e2e2] text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={16} />
              Retour
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[0.75rem] bg-[#C9A96E] text-white text-sm font-medium hover:bg-[#b8975e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[0.75rem] bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {creating ? "Création..." : "Créer la commande"}
                <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
