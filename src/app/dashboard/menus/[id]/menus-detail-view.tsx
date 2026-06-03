'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { EditMenuDialog } from '@/features/menus/components/edit-menu-dialog';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { Menu } from '@/features/menus/types';

const categoryLabels: Record<string, string> = {
  WEDDING: 'Mariage',
  CORPORATE: 'Entreprise',
  BUFFET: 'Buffet',
  COCKTAIL: 'Cocktail',
  BRUNCH: 'Brunch',
  DESSERT: 'Dessert',
  CUSTOM: 'Custom',
};

const categoryColors: Record<string, string> = {
  WEDDING: 'bg-pink-100 text-pink-800',
  CORPORATE: 'bg-blue-100 text-blue-800',
  BUFFET: 'bg-amber-100 text-amber-800',
  COCKTAIL: 'bg-purple-100 text-purple-800',
  BRUNCH: 'bg-orange-100 text-orange-800',
  DESSERT: 'bg-rose-100 text-rose-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
};

export default function MenuDetailView({ menu }: { menu: Menu }) {
  const price = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(menu.pricePerPerson);

  const created = new Date(menu.createdAt).toLocaleDateString('fr-FR');
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <motion.main
        className="min-h-screen bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="relative w-full h-64 md:h-72 bg-gradient-to-br from-[#1a1a1a] to-[#333] flex flex-col justify-end p-6">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Link
              href="/dashboard/menus"
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
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-md">
              {menu.name}
            </h1>
            <span
              className={`mt-2 inline-block w-fit px-3 py-1 rounded-full text-sm font-medium ${categoryColors[menu.category]}`}
            >
              {categoryLabels[menu.category] || menu.category}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="p-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
              <h2 className="text-sm text-gray-600 mb-1">Prix par personne</h2>
              <p className="text-lg font-medium text-gray-800">{price}</p>
            </div>

            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
              <h2 className="text-sm text-gray-600 mb-1">Nb. min de personnes</h2>
              <p className="text-lg font-medium text-gray-800">{menu.minPersons}</p>
            </div>

            {menu.maxPersons != null && (
              <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
                <h2 className="text-sm text-gray-600 mb-1">Nb. max de personnes</h2>
                <p className="text-lg font-medium text-gray-800">{menu.maxPersons}</p>
              </div>
            )}

            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white flex items-center">
              <h2 className="text-sm text-gray-600 mr-2">Statut</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${menu.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {menu.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div className="border border-[#e2e2e2] rounded-xl p-4 bg-white">
              <h2 className="text-sm text-gray-600 mb-1">Créé le</h2>
              <p className="text-lg font-medium text-gray-800">{created}</p>
            </div>
          </div>

          {/* Description */}
          {menu.description && (
            <div className="mt-6 border border-[#e2e2e2] rounded-xl p-4 bg-white">
              <h2 className="text-sm text-gray-600 mb-2">Description</h2>
              <p className="text-gray-800 whitespace-pre-line">{menu.description}</p>
            </div>
          )}
        </div>
      </motion.main>
      <EditMenuDialog
        menu={menu}
        open={editOpen}
        onClose={setEditOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
