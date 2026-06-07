'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'tur-privacy-mode';

interface PrivacyModeContextValue {
  isPrivacyMode: boolean;
  toggle: () => void;
}

const PrivacyModeContext = createContext<PrivacyModeContextValue>({
  isPrivacyMode: false,
  toggle: () => {},
});

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsPrivacyMode(true);
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <PrivacyModeContext.Provider value={{ isPrivacyMode, toggle }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  return useContext(PrivacyModeContext);
}

export function SensitiveValue({
  children,
  hidden,
  className = '',
  as: Tag = 'span',
}: {
  children: ReactNode;
  hidden?: boolean;
  className?: string;
  as?: 'span' | 'div';
}) {
  return (
    <Tag
      className={className}
      style={
        hidden
          ? { filter: 'blur(8px)', transition: 'filter 200ms', pointerEvents: 'none' }
          : { filter: 'blur(0px)', transition: 'filter 200ms' }
      }
      aria-hidden={hidden ? true : undefined}
    >
      {children}
    </Tag>
  );
}

export function EyeToggle() {
  const { isPrivacyMode, toggle } = usePrivacyMode();
  return (
    <Button
      variant="outline"
      onClick={toggle}
      className="h-10 rounded-lg border-border bg-background/60 backdrop-blur"
      title={isPrivacyMode ? 'Afficher les données sensibles' : 'Masquer les données sensibles'}
    >
      {isPrivacyMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      <span className="ml-1.5 text-xs">{isPrivacyMode ? 'Masqué' : 'Visible'}</span>
    </Button>
  );
}
