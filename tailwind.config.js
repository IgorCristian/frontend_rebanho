/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Sem pasta src, como no AleEdu: olha a raiz e as pastas específicas
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Identidade AleEdu
        marinho: { DEFAULT: '#050D21', claro: '#0a1a3f' },
        menta: { DEFAULT: '#56E39F', escuro: '#4CD090' },
      },
    },
  },
  plugins: [],
}
