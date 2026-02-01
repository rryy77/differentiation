/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ui: {
          base: "#f8fafc",      // より明るく読みやすい白
          muted: "#cbd5e1",     // より明るいグレー
          dim: "#94a3b8",       // 中間のグレー
        },
        accent: {
          cyan: "#22d3ee",      // より柔らかいシアン
          purple: "#c084fc",    // より明るいパープル
          pink: "#f472b6",      
          blue: "#60a5fa",      // より明るいブルー
          green: "#34d399",     // より明るいグリーン
          orange: "#fbbf24",    // より明るいオレンジ
        },
      },
      backgroundImage: {
        "limitdiff-page":
          "radial-gradient(ellipse 1400px 900px at 20% -15%, rgba(139,92,246,0.25), transparent 60%), radial-gradient(ellipse 1200px 800px at 85% 5%, rgba(6,182,212,0.2), transparent 55%), radial-gradient(ellipse 800px 600px at 50% 100%, rgba(236,72,153,0.1), transparent 50%), linear-gradient(180deg, #0f1420 0%, #0a0e18 100%)",
        "limitdiff-card":
          "linear-gradient(165deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%)",
        "limitdiff-panel":
          "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.75) 100%)",
        "nav-gradient":
          "linear-gradient(90deg, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.08) 50%, rgba(236,72,153,0.08) 100%)",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0,240,255,0.3), 0 0 40px rgba(0,240,255,0.1)",
        "glow-purple": "0 0 20px rgba(168,85,247,0.3), 0 0 40px rgba(168,85,247,0.1)",
        "glow-pink": "0 0 15px rgba(244,114,182,0.25)",
        "card": "0 25px 80px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        "card-hover": "0 30px 100px rgba(0,0,0,0.6), 0 15px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.8" },
          "100%": { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
