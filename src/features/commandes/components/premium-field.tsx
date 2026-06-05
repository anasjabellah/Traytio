"use client"

export function PremiumField({
  label, value, onChange, placeholder, multiline, type = "text", icon, prefix, suffix,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string; icon?: React.ReactNode;
  prefix?: string; suffix?: string;
}) {
  return (
    <label className="block group">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-3 transition-all focus-within:border-gold focus-within:ring-gold">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        {multiline ? (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm min-h-[80px] focus:outline-none resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        )}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}
