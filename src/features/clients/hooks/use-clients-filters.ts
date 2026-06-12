'use client';

import { useState, useMemo } from 'react';
import type { ClientWithStats } from '@/features/clients/types';

export const SORT_OPTIONS = [
  { value: 'name' as const, label: 'Nom' },
  { value: 'createdAt' as const, label: 'Date de création' },
  { value: 'totalSpent' as const, label: 'Total dépensé' },
  { value: 'lastOrderAt' as const, label: 'Dernière activité' },
];

export function useClientsFilters(clients: ClientWithStats[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredClients = useMemo(() => {
    let result = clients;
    if (sortBy === 'totalSpent') result = [...result].sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent));
    else if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'lastOrderAt') {
      result = [...result].sort((a, b) => {
        if (!a.lastOrderAt) return 1;
        if (!b.lastOrderAt) return -1;
        return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      });
    }
    return result;
  }, [clients, sortBy]);

  return {
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    showFilters, setShowFilters,
    viewMode, setViewMode,
    filteredClients,
  };
}
