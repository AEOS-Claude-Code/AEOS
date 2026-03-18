/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      /* ── Brand palette ──────────────────────────────────────── */
      colors: {
        aeos: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bbdaff",
          300: "#8cc2ff",
          400: "#559fff",
          500: "#2e79ff",
          600: "#1758f5",
          700: "#1044e1",
          800: "#1338b6",
          900: "#16338f",
          950: "#122157",
        },

        /* ── Semantic surface tokens ──────────────────────────── */
        surface: {
          base: "var(--surface-base)",
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
          tertiary: "var(--surface-tertiary)",
          inset: "var(--surface-inset)",
        },
        border: {
          DEFAULT: "var(--border)",
          light: "var(--border-light)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        fg: {
          DEFAULT: "var(--fg)",
          secondary: "var(--fg-secondary)",
          muted: "var(--fg-muted)",
          hint: "var(--fg-hint)",
          inverse: "var(--fg-inverse)",
        },

        /* ── Status tokens ────────────────────────────────────── */
        status: {
          success: "#10b981",
          "success-light": "var(--status-success-light)",
          "success-text": "var(--status-success-text)",
          warning: "#f59e0b",
          "warning-light": "var(--status-warning-light)",
          "warning-text": "var(--status-warning-text)",
          danger: "#ef4444",
          "danger-light": "var(--status-danger-light)",
          "danger-text": "var(--status-danger-text)",
          info: "#3b82f6",
          "info-light": "var(--status-info-light)",
          "info-text": "var(--status-info-text)",
        },

        /* ── Category tokens (modules, departments) ───────────── */
        category: {
          marketing: { DEFAULT: "#3b82f6", light: "var(--cat-marketing-light)", text: "var(--cat-marketing-text)" },
          growth: { DEFAULT: "#10b981", light: "var(--cat-growth-light)", text: "var(--cat-growth-text)" },
          operations: { DEFAULT: "#f59e0b", light: "var(--cat-operations-light)", text: "var(--cat-operations-text)" },
          technology: { DEFAULT: "#8b5cf6", light: "var(--cat-technology-light)", text: "var(--cat-technology-text)" },
          hr: { DEFAULT: "#ec4899", light: "var(--cat-hr-light)", text: "var(--cat-hr-text)" },
          finance: { DEFAULT: "#06b6d4", light: "var(--cat-finance-light)", text: "var(--cat-finance-text)" },
          executive: { DEFAULT: "#6366f1", light: "var(--cat-executive-light)", text: "var(--cat-executive-text)" },
        },

        /* ── Severity tokens ──────────────────────────────────── */
        severity: {
          critical: { DEFAULT: "#ef4444", light: "var(--sev-critical-light)", text: "var(--sev-critical-text)" },
          high: { DEFAULT: "#f59e0b", light: "var(--sev-high-light)", text: "var(--sev-high-text)" },
          medium: { DEFAULT: "#eab308", light: "var(--sev-medium-light)", text: "var(--sev-medium-text)" },
          low: { DEFAULT: "#94a3b8", light: "var(--sev-low-light)", text: "var(--sev-low-text)" },
        },

        /* ── Sidebar tokens ───────────────────────────────────── */
        sidebar: {
          bg: "#0f1729",
          fg: "#94a3c3",
          hover: "rgba(255,255,255,0.06)",
          active: "#2e79ff",
          border: "rgba(255,255,255,0.05)",
        },
      },

      /* ── Spacing scale (extends default) ────────────────────── */
      spacing: {
        4.5: "1.125rem",  /* 18px */
        13: "3.25rem",     /* 52px */
        15: "3.75rem",     /* 60px – topbar */
        18: "4.5rem",      /* 72px */
        63: "15.75rem",    /* 252px – sidebar */
      },

      /* ── Border radius ──────────────────────────────────────── */
      borderRadius: {
        card: "1rem",      /* 16px – primary card radius */
        widget: "0.75rem", /* 12px – inner widget radius */
        pill: "9999px",
      },

      /* ── Font ───────────────────────────────────────────────── */
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },

      /* ── Font sizes (design system scale) ───────────────────── */
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],   /* 10px */
        "xs-tight": ["0.6875rem", { lineHeight: "1rem" }], /* 11px */
        "sm-tight": ["0.8125rem", { lineHeight: "1.25rem" }], /* 13px */
      },

      /* ── Box shadow ─────────────────────────────────────────── */
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
      },

      /* ── Animation ──────────────────────────────────────────── */
      keyframes: {
        "card-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "score-fill": {
          from: { strokeDashoffset: "251" },
        },
      },
      animation: {
        "card-in": "card-in 0.4s ease-out both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "score-fill": "score-fill 1s ease-out",
      },
    },
  },
  plugins: [],
};
