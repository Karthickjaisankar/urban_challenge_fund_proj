/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body:    ["'Manrope'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // ── Light surface (center + right panel) ───────────────────────────
        surface: {
          50:  "#FFFFFF",
          100: "#F7F9FC",
          200: "#EEF2F7",   // page background
          300: "#E2E8F0",
          400: "#CBD5E0",
          500: "#A0AEC0",
          700: "#4A5568",
          800: "#2D3748",
          900: "#1A202C",
        },
        // ── Dark sidebar (kept intentionally) ──────────────────────────────
        shell: {
          950: "#080E16",
          900: "#0D1821",
          800: "#0F1F2E",
          700: "#162033",
          600: "#1E2E42",
          500: "#283D54",
          400: "#374F66",
          200: "#5A7490",
          100: "#8EA4BC",
        },
        // ── Accent: India tricolor tints ────────────────────────────────────
        saffron: { 500: "#FF7722", 400: "#FF9345", 300: "#FFB27A" },
        // ── Department accent palette (neon-on-dark) ────────────────────────
        health:    "#00D4AA",   // teal mint
        education: "#4A9EFF",   // bright sky-blue
        wcd:       "#FF6B9D",   // rose pink
        revenue:   "#FFB347",   // amber
        energy:    "#7FE0FF",   // electric cyan
        disaster:  "#FF5757",   // alert red
        tourism:   "#A78BFA",   // violet
        // ── ICCC nodes ──────────────────────────────────────────────────────
        nodal:    "#FFD700",   // gold
        subnodal: "#4A9EFF",   // blue
        // ── Surface helpers ─────────────────────────────────────────────────
        border: { subtle: "rgba(255,255,255,0.07)", mid: "rgba(255,255,255,0.13)" },
      },
      boxShadow: {
        card: "0 2px 0 rgba(255,255,255,0.03) inset, 0 -2px 0 rgba(0,0,0,0.25) inset, 0 8px 32px -8px rgba(0,0,0,0.5)",
        glow:      "0 0 20px -4px",
        panelLeft: "-1px 0 0 rgba(255,255,255,0.07)",
      },
      keyframes: {
        pulseRing: {
          "0%"  : { "box-shadow": "0 0 0 0 rgba(255,215,0,0.55)" },
          "70%" : { "box-shadow": "0 0 0 14px rgba(255,215,0,0)" },
          "100%": { "box-shadow": "0 0 0 0 rgba(255,215,0,0)" },
        },
        pulseRingBlue: {
          "0%"  : { "box-shadow": "0 0 0 0 rgba(74,158,255,0.45)" },
          "70%" : { "box-shadow": "0 0 0 8px rgba(74,158,255,0)" },
          "100%": { "box-shadow": "0 0 0 0 rgba(74,158,255,0)" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to:   { transform: "translateY(0)",   opacity: "1" },
        },
      },
      animation: {
        "pulse-nodal":    "pulseRing     2.2s ease-in-out infinite",
        "pulse-subnodal": "pulseRingBlue 2.8s ease-in-out infinite",
        "slide-in-right": "slideInRight  300ms cubic-bezier(.2,.9,.2,1)",
        "fade-up":        "fadeUp        200ms ease-out",
      },
    },
  },
  plugins: [],
};
