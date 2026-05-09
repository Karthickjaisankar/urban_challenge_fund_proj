/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Editorial display serif + clean modern sans + tabular mono
        display: ["'Fraunces'", "'Instrument Serif'", "serif"],
        body:    ["'Manrope'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Indian-tricolor editorial palette — warm cream base + saffron / India-blue / emerald accents
        cream: {
          50:  "#fdfbf6",
          100: "#faf6ec",
          200: "#f3ecda",
          300: "#e7dcc1",
        },
        saffron: {
          50:  "#fff4ec",
          100: "#ffe6d3",
          300: "#ffb27a",
          500: "#ff7722",   // tricolor saffron
          600: "#e6620f",
          700: "#b94d0a",
        },
        ashoka: {
          50:  "#eaf2ff",
          100: "#cfe0ff",
          300: "#5a8cd8",
          500: "#0c4ca3",   // Ashoka chakra blue / India navy
          600: "#093d85",
          700: "#062b66",
        },
        emerald2: {
          50:  "#e9f7ec",
          100: "#c8ecd0",
          300: "#67c47b",
          500: "#128807",   // Indian flag green
          600: "#0e6b06",
          700: "#0a4f04",
        },
        ink2: {
          50:  "#f6f4ef",
          200: "#d8d3c4",
          400: "#7a7565",
          600: "#3a382f",
          700: "#262521",
          800: "#171612",
          900: "#0c0b09",
        },
        // Department category colors — calibrated for light backgrounds
        dept: {
          health:    "#128807",   // emerald (Indian green)
          education: "#0c4ca3",   // ashoka blue
          wcd:       "#c4368e",   // magenta
          revenue:   "#ff7722",   // saffron
          disaster:  "#b81d24",   // ruby
          tourism:   "#7c3aed",   // royal purple
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px -12px rgba(15, 23, 42, 0.10)",
        cardHover: "0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 8px rgba(15, 23, 42, 0.08), 0 18px 36px -12px rgba(15, 23, 42, 0.18)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(15,23,42,0.04)",
      },
      backgroundImage: {
        "tricolor": "linear-gradient(180deg, #FF7722 0%, #FFFFFF 50%, #128807 100%)",
        "tricolor-thin": "linear-gradient(90deg, #FF7722 0%, #FF7722 33%, #ffffff 33%, #ffffff 66%, #128807 66%, #128807 100%)",
        "paper":
          "radial-gradient(120% 80% at 0% 0%, rgba(255,119,34,0.06), transparent 50%), radial-gradient(120% 80% at 100% 100%, rgba(12,76,163,0.06), transparent 55%), #fdfbf6",
      },
    },
  },
  plugins: [],
};
