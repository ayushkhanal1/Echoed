/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        echo: {
          50: "#f5f6f8",
          100: "#eaecf1",
          200: "#d7dce5",
          300: "#b8c2d2",
          400: "#92a1ba",
          500: "#7283a2",
          600: "#596a8a",
          700: "#475471",
          800: "#3d475e",
          900: "#1e2432",
          950: "#0f121a",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        glass: "0 8px 30px rgba(0, 0, 0, 0.06)",
        card: "0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -15px rgba(0,0,0,0.07)",
      },
    },
  },
  plugins: [],
};
