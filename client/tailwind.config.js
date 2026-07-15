/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables (see src/index.css).
        // Using rgb(var(--x) / <alpha-value>) lets these support Tailwind's
        // opacity modifiers, e.g. bg-card/50, border-border/60.
        background: 'rgb(var(--app-bg) / <alpha-value>)',
        card: 'rgb(var(--app-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--app-surface-muted) / <alpha-value>)',
        foreground: 'rgb(var(--app-text) / <alpha-value>)',
        muted: 'rgb(var(--app-muted) / <alpha-value>)',
        border: 'rgb(var(--app-border) / <alpha-value>)',
        input: 'rgb(var(--app-border-strong) / <alpha-value>)',
        accent: 'rgb(var(--app-accent) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

