/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'serif'],
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        'primary-light': 'var(--primary-light)',
        gold: 'var(--gold)',
        'gold-light': 'var(--gold-light)',
        red: 'var(--red)',
        'red-light': 'var(--red-light)',
      },
    },
  },
  plugins: [],
}
