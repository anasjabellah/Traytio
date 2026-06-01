// src/app/dashboard/menu-items/[id]/menu-item-detail-view.tsx
// Rewritten component – product‑detail style page
// Full‑width header image with gradient overlay showing name & category badge.
// Below: responsive grid of info cards (price, unit, status, date, notes).
// Gold accent colour: #C9A96E

'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { EditMenuItemDialog } from '@/features/menu-items/components/edit-menu-item-dialog';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { MenuItem } from '@/features/menu-items/types';

// Re‑usable colour mapping for the category badge
const categoryColors: Record<string, string> = {
  FOOD: 'bg-amber-100 text-amber-800',
  DRINKS: 'bg-blue-100 text-blue-800',
  DESSERTS: 'bg-pink-100 text-pink-800',
  DECORATION: 'bg-purple-100 text-purple-800',
  STAFF: 'bg-green-100 text-green-800',
  ENTERTAINMENT: 'bg-orange-100 text-orange-800',
  EXTRAS: 'bg-gray-100 text-gray-800',
};

const categoryLabels: Record<string, string> = {
  FOOD: 'Aliment',
  DRINKS: 'Boisson',
  DESSERTS: 'Dessert',
  DECORATION: 'Décoration',
  STAFF: 'Personnel',
  ENTERTAINMENT: 'Divertissement',
  EXTRAS: 'Extras',
};

/**
 * Detail view for a single menu item.
 *
 * Layout:
 *   ────────────────────────────────────────
 *   |  Header image (full width)           |
 *   |  Gradient overlay with name & badge   |
 *   ────────────────────────────────────────
 *   |  Grid of info cards (price, unit,   |
 *   |   status, created, notes)            |
 *   ────────────────────────────────────────
 */
export default function MenuItemDetailView({
  item,
}: {
  item: MenuItem;
}) {
  // Format helpers – keep the same locale as the original component
  const price = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(item.unitPrice);

  const created = new Date(item.createdAt).toLocaleDateString('fr-FR');
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  // ---------------------------------------------------------------------
  //  Render
  // ---------------------------------------------------------------------
  return (
    <>
      <motion.main
        className="min-h-screen bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Header – image with gradient overlay */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative w-full h-80 md:h-96">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Pas d'image</span>
            </div>
          )}
          {/* Gradient overlay – dark → transparent */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-md">
              {item.name}
            </h1>
            <span
              className={`mt-2 inline-block w-fit px-3 py-1 rounded-full text-sm font-medium ${categoryColors[item.category]}`}
            >
              {categoryLabels[item.category]}
            </span>
          </div>
          {/* Back / Edit buttons – placed in top‑left / top‑right corners */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Link
              href="/dashboard/menu-items"
              className="flex items-center gap-1 text-[#C9A96E] hover:text-[#C9A96E]/80 bg-white/80 px-3 py-1 rounded-full"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Retour</span>
            </Link>
          </div>
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E] text-white rounded-md hover:bg-[#C9A96E]/90"
            >
              <Pencil size={14} />
              <span className="text-sm">Modifier</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Info grid – cards */}
        {/* ----------------------------------------------------------------- */}
        <div className="p-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price card */}
            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
              <h2 className="text-sm text-gray-600 mb-1">Prix unitaire</h2>
              <p className="text-lg font-medium text-gray-800">{price}</p>
            </div>

            {/* Unit card – optional */}
            {item.unit && (
              <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
                <h2 className="text-sm text-gray-600 mb-1">Unité</h2>
                <p className="text-lg font-medium text-gray-800">{item.unit}</p>
              </div>
            )}

            {/* Status card */}
            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white flex items-center">
              <h2 className="text-sm text-gray-600 mr-2">Statut</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {item.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {/* Created date card */}
            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
              <h2 className="text-sm text-gray-600 mb-1">Créé le</h2>
              <p className="text-lg font-medium text-gray-800">{created}</p>
            </div>

            {/* Notes card – spans full width on small screens */}
            {item.notes && (
              <div className="md:col-span-2 lg:col-span-3 border border-[#e2e2e2] rounded-xl p-4 bg-white">
                <h2 className="text-sm text-gray-600 mb-2">Notes</h2>
                <p className="text-gray-800 whitespace-pre-line">{item.notes}</p>
              </div>
            )}
          </div>
        </div>
      </motion.main>
      <EditMenuItemDialog
        item={item}
        open={editOpen}
        onClose={setEditOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
