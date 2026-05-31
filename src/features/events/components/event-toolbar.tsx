import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type EventToolbarProps = {
  onSearch: (q: string) => void;
  onAddEvent: () => void;
  totalCount: number;
};

export function EventToolbar({ onSearch, onAddEvent, totalCount }: EventToolbarProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    handleSearchChange(value);
  };

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex w-full md:w-auto items-center gap-3">
          <Input
            placeholder="Rechercher des événements..."
            value={search}
            onChange={handleInputChange}
            className="border border-[#e2e2e2] rounded-[0.75rem] h-10 w-full max-w-xs md:w-[250px] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
          <span className="text-sm text-muted-foreground">
            {totalCount} résultat{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="default"
          className="bg-[#C9A96E] text-white rounded-[0.75rem] px-5 py-2 font-medium hover:bg-[#b8975e]"
          onClick={onAddEvent}
        >
          Nouvel événement
        </Button>
      </div>
    </div>
  );
}
