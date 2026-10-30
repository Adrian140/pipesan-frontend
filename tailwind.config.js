/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Premium technical palette: graphite surfaces + machined brass accents.
        // `primary` remains the app-wide action color (now brass), so admin,
        // dashboard and checkout pick up the new look without per-file edits.
        primary: {
          DEFAULT: '#8C6A2E',
          dark: '#6F5323',
          light: '#B8893B'
        },
        accent: {
          DEFAULT: '#B8893B',
          dark: '#8C6A2E',
          light: '#D4A85A'
        },
        text: {
          primary: '#14181E',
          secondary: '#5B6470',
          light: '#8A929C'
        },
        graphite: {
          950: '#0B0E12',
          900: '#12161C',
          800: '#1B2028',
          700: '#262C36',
          600: '#363E4A',
          500: '#4A5361',
        },
        brass: {
          DEFAULT: '#B8893B',
          light: '#D4A85A',
          pale: '#F3E9D6',
          dark: '#8C6A2E',
        },
        paper: '#F6F4EF',
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
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,24,30,0.04), 0 8px 24px -12px rgba(20,24,30,0.12)',
        lift: '0 2px 4px rgba(20,24,30,0.06), 0 24px 48px -20px rgba(20,24,30,0.28)',
      },
    },
  },
  plugins: [],
}
