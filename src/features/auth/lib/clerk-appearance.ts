const radius = "calc(0.75rem * 2.2)"; // --radius-3xl (26.4px)
const shadowLift =
  "0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)";

/**
 * Shared Clerk appearance used by both <SignIn /> and <SignUp /> so the
 * authentication flow reads as a natural extension of the marketing site.
 * Object values are applied as inline CSS, so they reliably win over Clerk's
 * own styles. Colors/fonts mirror DESIGN.md tokens.
 */
export const authAppearance = {
  variables: {
    colorPrimary: "#C9A96E",
    colorBackground: "#ffffff",
    colorText: "#1a1a1a",
    colorTextSecondary: "#888888",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1a1a",
    colorBorder: "#e2e2e2",
    colorDanger: "#cc3333",
    colorSuccess: "rgb(16 185 129)",
    borderRadius: "0.75rem",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  layout: {
    socialButtonsPlacement: "bottom",
    logoPlacement: "inside",
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    cardBox: {
      boxShadow: "none",
      width: "100%",
    },
    card: {
      boxShadow: shadowLift,
      border: "1px solid rgba(226,226,226,0.7)",
      borderRadius: radius,
      backgroundColor: "#ffffff",
      padding: "2.5rem 2.25rem",
    },
    logoBox: {
      display: "none",
    },
    header: {
      marginBottom: "1.5rem",
      textAlign: "left",
    },
    headerTitle: {
      fontFamily: "var(--font-heading), Georgia, serif",
      fontSize: "2rem",
      lineHeight: "1.1",
      letterSpacing: "-0.03em",
      fontWeight: 500,
      color: "#1a1a1a",
    },
    headerSubtitle: {
      color: "#888888",
      fontSize: "0.875rem",
      lineHeight: "1.6",
      marginTop: "0.5rem",
    },
    formFieldLabel: {
      color: "#1a1a1a",
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    formFieldInput: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e2e2",
      borderRadius: "0.75rem",
      height: "2.75rem",
      padding: "0 0.875rem",
      fontSize: "0.875rem",
      color: "#1a1a1a",
      boxShadow: "none",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      "&:focus": {
        borderColor: "#C9A96E",
        boxShadow: "0 0 0 2px rgba(201, 169, 110, 0.5)",
      },
      "&:disabled": {
        backgroundColor: "#f0f0f0",
      },
    },
    formFieldErrorText: {
      color: "#cc3333",
      fontSize: "0.75rem",
      fontWeight: 500,
    },
    formButtonPrimary: {
      background:
        "linear-gradient(135deg, #f3d28b 0%, #d4a24c 50%, #b8842f 100%)",
      color: "oklch(0.20 0.012 70)",
      borderRadius: "0.75rem",
      height: "2.75rem",
      fontSize: "0.875rem",
      fontWeight: 600,
      boxShadow: "0 4px 14px rgba(212, 162, 76, 0.25)",
      transition: "box-shadow 0.2s ease, filter 0.2s ease",
      "&:hover": {
        boxShadow: "0 8px 24px rgba(212, 162, 76, 0.35)",
      },
      "&:disabled": {
        opacity: 0.7,
        boxShadow: "none",
      },
    },
    formButtonReset: {
      backgroundColor: "#f5f5f5",
      color: "#1a1a1a",
      border: "1px solid #e2e2e2",
      borderRadius: "0.75rem",
      height: "2.5rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      "&:hover": {
        backgroundColor: "#f0f0f0",
      },
    },
    formFieldAction: {
      color: "#C9A96E",
      fontSize: "0.875rem",
      fontWeight: 600,
    },
    dividerRow: {
      margin: "1.5rem 0",
    },
    dividerLine: {
      backgroundColor: "#e2e2e2",
    },
    dividerText: {
      color: "#888888",
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 500,
    },
    socialButtonsRoot: {
      gap: "0.75rem",
    },
    socialButtonsBlockButton: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e2e2",
      borderRadius: "0.75rem",
      height: "2.75rem",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "#f5f5f5",
      },
    },
    socialButtonsBlockButtonText: {
      color: "#1a1a1a",
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    footer: {
      marginTop: "0.75rem",
    },
    footerAction: {
      color: "#888888",
      fontSize: "0.875rem",
    },
    footerActionLink: {
      color: "#C9A96E",
      fontWeight: 600,
      "&:hover": {
        textDecoration: "underline",
      },
    },
    footerPagesLink: {
      color: "#888888",
    },
    identityPreview: {
      backgroundColor: "#f5f5f5",
      border: "1px solid #e2e2e2",
      borderRadius: "0.75rem",
    },
    otpCodeFieldInput: {
      borderRadius: "0.75rem",
      border: "1px solid #e2e2e2",
    },
  },
};
