/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Moryelle Beauté Brand Sheet Tokens
        mb: {
          bg:              "var(--color-bg)",
          surface:         "var(--color-surface)",
          dusty:           "var(--color-surface-strong)",
          primary:         "var(--color-primary)",
          "primary-hover": "var(--color-primary-hover)",
          accent:          "var(--color-accent)",
          "accent-deep":   "var(--color-accent-deep)",
          gold:            "var(--color-gold)",
          "gold-deep":     "var(--color-gold-deep)",
          text:            "var(--color-text-main)",
          body:            "var(--color-text-body)",
          muted:           "var(--color-text-muted)",
          placeholder:     "var(--color-text-placeholder)",
          border:          "var(--color-border)",
          "border-lite":   "var(--color-border-lite)",
          success:         "var(--color-success)",
          error:           "var(--color-error)",
          // Direct brand palette hex mappings
          cream:           "#FFF7F2",
          blush:           "#F7E7E9",
          plum:            "#6D3A4E",
          mauve:           "#B76B7A",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'SF Pro Text'", "'Segoe UI'", "Roboto", "sans-serif"],
        heading: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'SF Pro Text'", "'Segoe UI'", "Roboto", "sans-serif"],
        serif: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'SF Pro Text'", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(109,58,78,0.10)",
        dropdown: "0 4px 20px rgba(109,58,78,0.15)",
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
        xl: "8px",
        "2xl": "10px",
        full: "9999px",
      },
      maxWidth: {
        content: "1280px",
        site:    "1440px",
      },
      letterSpacing: {
        subbrand: "0.25em",
        tagline:  "0.30em",
      },
    },
  },
  plugins: [],
};
