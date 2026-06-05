export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement de l&apos;événement...</p>
      </div>
    </div>
  );
}
