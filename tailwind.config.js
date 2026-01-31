/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "limitdiff-page":
          "radial-gradient(1200px 700px at 30% -10%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(1000px 600px at 90% 0%, rgba(34,211,238,0.24), transparent 55%), linear-gradient(180deg, #0b1020 0%, #070a14 100%)",
        "limitdiff-card":
          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
        "limitdiff-panel":
          "linear-gradient(180deg, rgba(2,6,23,0.65), rgba(2,6,23,0.35))",
      },
    },
  },
  plugins: [],
};
