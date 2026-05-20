/**
 * Design tokens for the TUR luxury hospitality SaaS platform.
 *
 * Usage:
 *   import { tokens } from "@/lib/design-tokens";
 *   <div style={{ backgroundColor: tokens.colors.gold }} />
 */

export const tokens = {
  /*** Colors ***/
  colors: {
    charcoal: "#1a1a1a",
    gold: "#C9A96E",
    cream: "#ffffff",
    champagne: "#f5f5f5",
    taupe: "#888888",
  },

  /*** Typography scale (px) ***/
  typography: {
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    base: "1rem",      // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
  },

  /*** Spacing scale (rem) ***/
  spacing: {
    xs: "0.25rem",  // 4px
    sm: "0.5rem",   // 8px
    md: "1rem",     // 16px
    lg: "1.5rem",   // 24px
    xl: "2rem",     // 32px
    "2xl": "3rem",  // 48px
  },

  /*** Border radius ***/
  radius: {
    sm: "0.375rem",  // 6px
    md: "0.5rem",    // 8px
    lg: "0.75rem",   // 12px
    xl: "1rem",      // 16px
    full: "9999px",
  },

  /*** Shadows (elegant, subtle) ***/
  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    md: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
    lg: "0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)",
    gold: "0 4px 14px rgba(201, 168, 76, 0.35)",
  },
} as const;

export type DesignTokens = typeof tokens;