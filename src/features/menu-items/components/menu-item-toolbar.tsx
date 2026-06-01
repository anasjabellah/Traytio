'use client';

import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type MenuItemToolbarProps = {
  onSearch: (q: string) => void;
  onAddItem: () => void;
  totalCount: number;
};

export function MenuItemToolbar({ onSearch, onAddItem, totalCount }: MenuItemToolbarProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debounced = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debounced(e.target.value);
  };

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Rechercher des articles..."
          value={search}
          onChange={handleSearchChange}
          className="border border-[#e2e2e2] rounded-[0.75rem] h-10 w-full max-w-xs md:w-[250px] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        />
        <span className="text-sm text-muted-foreground">
          {totalCount} résultat{totalCount !== 1 ? 's' : ''}
        </span>
      </div>
      <Button
        variant="default"
        className="bg-[#C9A96E] text-white rounded-[0.75rem] px-5 py-2 font-medium hover:bg-[#b8975e]"
        onClick={onAddItem}
      >
        Nouvel article
      </Button>
    </div>
  );
}