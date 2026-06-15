import { Loader2 } from 'lucide-react';

export default function MenuDetailLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement du menu...</p>
      </div>
    </div>
  );
}
