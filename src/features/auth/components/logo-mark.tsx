import Link from "next/link";

export function LogoMark({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Accueil TUR"
      className="group inline-flex items-center gap-2.5"
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-charcoal text-primary-foreground">
        <span className="font-display text-lg leading-none">T</span>
        <span className="absolute -inset-px rounded-full ring-1 ring-gold opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {withWordmark && (
        <span className="font-display text-2xl tracking-tight">TUR</span>
      )}
    </Link>
  );
}
