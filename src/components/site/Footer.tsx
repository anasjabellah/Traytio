export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-charcoal text-primary-foreground font-display text-lg">T</span>
          <span className="font-display text-2xl tracking-tight">TUR</span>
          <span className="text-xs text-muted-foreground ml-3">© 2026 — Le système d'exploitation des traiteurs.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
          <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}