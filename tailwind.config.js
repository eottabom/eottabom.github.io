module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./posts/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Inter'", "sans-serif"]
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
