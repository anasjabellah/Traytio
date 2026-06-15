import { Loader2 } from 'lucide-react';

export default function ClientDetailLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement du client...</p>
      </div>
    </div>
  );
}
