import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Luxury table components for the hospitality SaaS.
 * Uses Tailwind utility classes that match the existing design system.
 * All components accept a `className` prop for extensibility.
 */

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full rounded-lg border border-border/30 bg-card/30">
      <table
        className={cn(
          "w-full caption-bottom text-sm",
          "[&_thead]:bg-card/40 [&_thead]:text-foreground",
          "[&_tbody_tr:hover]:bg-card/20",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn("bg-muted/20", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn("bg-card/5", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        "border-b border-border/20",
        "data-[state=selected]:bg-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        "px-4 py-2 text-left font-medium text-muted-foreground",
        "first:rounded-tl-lg last:rounded-tr-lg",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        "px-4 py-2 text-foreground",
        "first:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}
