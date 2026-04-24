/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slateNight: "#05070d",
        panel: "#0d111b",
        panelSoft: "#12192a",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
