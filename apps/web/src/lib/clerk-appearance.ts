export const clerkAppearance = {
  variables: {
    colorPrimary: "oklch(0.488 0.243 264.376)",
    colorBackground: "var(--card)",
    colorText: "var(--foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    borderRadius: "1rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    rootBox: "mx-auto w-full",
    card: "shadow-none border rounded-3xl bg-card",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: "border rounded-xl",
    formButtonPrimary:
      "bg-foreground text-background hover:bg-foreground/90 rounded-full normal-case",
    footerActionLink: "text-primary hover:text-primary/80",
    formFieldInput: "rounded-xl border-input",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    navbarButton: "text-foreground",
    organizationPreviewMainIdentifier: "font-semibold",
    organizationPreviewSecondaryIdentifier: "text-muted-foreground",
  },
} as const;