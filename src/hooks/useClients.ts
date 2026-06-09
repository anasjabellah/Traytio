import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
};

export function useClients(search?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("limit", "200");
        const res = await fetch(`/api/clients?${params}`);
        if (!res.ok) throw new Error("Failed to load clients");
        const json = await res.json();
        setClients(Array.isArray(json) ? json : json.data ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [search]);

  return { clients, loading, error };
}
