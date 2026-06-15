import { Loader2 } from 'lucide-react';

export default function CommandesLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement des commandes...</p>
      </div>
    </div>
  );
}
