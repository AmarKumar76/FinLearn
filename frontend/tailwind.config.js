/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aubergine: {
          DEFAULT: '#321D35',
          dark: '#241426',
          light: '#4A2B4E',
          deep: '#1D101E',
        },
        terracotta: {
          DEFAULT: '#D15C40',
          hover: '#BA4E35',
          light: '#E2765D',
          dark: '#A6432C',
        },
        ivory: {
          DEFAULT: '#FAF5EB',
          light: '#FFFDF9',
          dark: '#F0E8D7',
          surface: '#FDFBF7',
        },
        brass: {
          DEFAULT: '#B88C56',
          light: '#CFA774',
          dark: '#966E3A',
        },
        lilac: {
          DEFAULT: '#D7C5D8',
          light: '#E9DEEA',
          dark: '#BAA2BC',
          soft: '#F4EEF5',
        },
        theme: {
          app: 'var(--bg-app)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          subtle: 'var(--bg-surface-subtle)',
          sidebar: 'var(--bg-sidebar)',
          'sidebar-border': 'var(--bg-sidebar-border)',
          border: 'var(--border-subtle)',
          'border-strong': 'var(--border-strong)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          'sidebar-text': 'var(--sidebar-text)',
          'sidebar-muted': 'var(--sidebar-text-muted)',
          'sidebar-icon': 'var(--sidebar-icon)',
          'sidebar-hover': 'var(--sidebar-hover)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
