/** @type {import('tailwindcss').Config} */
module.exports = {
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
          DEFAULT: "#ffffff",
          secondary: "#f8f9fb",
          tertiary: "#f3f4f8",
          inset: "#eef0f4",
        },
        border: {
          DEFAULT: "#e2e5ed",
          light: "#eef0f4",
          focus: "#bbdaff",
        },
        fg: {
          DEFAULT: "#0f1729",
          secondary: "#4b5468",
          muted: "#7c8497",
          hint: "#a3aab8",
          inverse: "#ffffff",
        },

        /* ── Status tokens ────────────────────────────────────── */
        status: {
          success: "#10b981",
          "success-light": "#ecfdf5",
          "success-text": "#065f46",
          warning: "#f59e0b",
          "warning-light": "#fffbeb",
          "warning-text": "#92400e",
          danger: "#ef4444",
          "danger-light": "#fef2f2",
          "danger-text": "#991b1b",
          info: "#3b82f6",
          "info-light": "#eff6ff",
          "info-text": "#1e40af",
        },

        /* ── Category tokens (modules, departments) ───────────── */
        category: {
          marketing: { DEFAULT: "#3b82f6", light: "#eff6ff", text: "#1e40af" },
          growth: { DEFAULT: "#10b981", light: "#ecfdf5", text: "#065f46" },
          operations: { DEFAULT: "#f59e0b", light: "#fffbeb", text: "#92400e" },
          technology: { DEFAULT: "#8b5cf6", light: "#f5f3ff", text: "#5b21b6" },
          hr: { DEFAULT: "#ec4899", light: "#fdf2f8", text: "#9d174d" },
          finance: { DEFAULT: "#06b6d4", light: "#ecfeff", text: "#155e75" },
          executive: { DEFAULT: "#6366f1", light: "#eef2ff", text: "#3730a3" },
        },

        /* ── Severity tokens ──────────────────────────────────── */
        severity: {
          critical: { DEFAULT: "#ef4444", light: "#fef2f2", text: "#991b1b" },
          high: { DEFAULT: "#f59e0b", light: "#fffbeb", text: "#92400e" },
          medium: { DEFAULT: "#eab308", light: "#fefce8", text: "#854d0e" },
          low: { DEFAULT: "#94a3b8", light: "#f8fafc", text: "#475569" },
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
