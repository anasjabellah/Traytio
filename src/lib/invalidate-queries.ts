'use client';

import { useQueryClient } from '@tanstack/react-query';

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (keys: string[][]) => {
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}
