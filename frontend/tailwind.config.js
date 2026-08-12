/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6C5CE7',
          bg: '#F7F7FB',
          green: '#2ECC71',
          amber: '#F5A623',
          blue: '#3B82F6',
          border: '#EFEFF5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

