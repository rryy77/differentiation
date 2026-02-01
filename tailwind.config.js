/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ui: {
          base: "#e2e8f0",
          muted: "#94a3b8",
          dim: "#64748b",
        },
      },
      backgroundImage: {
        "limitdiff-page":
          "radial-gradient(1200px 700px at 30% -10%, rgba(99,102,241,0.32), transparent 55%), radial-gradient(1000px 600px at 90% 0%, rgba(34,211,238,0.22), transparent 55%), linear-gradient(180deg, #0f1420 0%, #0a0e18 100%)",
        "limitdiff-card":
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
        "limitdiff-panel":
          "linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.5))",
      },
    },
  },
  plugins: [],
};
