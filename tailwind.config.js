/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#3B82F6'
        },
        accent: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          light: '#EF4444'
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          light: '#94A3B8'
        },
        copper: {
          DEFAULT: '#B87333',
          dark: '#8B4513',
          light: '#CD853F'
        },
        steel: {
          DEFAULT: '#71717A',
          dark: '#52525B',
          light: '#A1A1AA'
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
      }
    },
  },
  plugins: [],
}
