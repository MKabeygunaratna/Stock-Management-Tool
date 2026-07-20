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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUpIn: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        overlayIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        ring: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(12deg)' },
          '20%': { transform: 'rotate(-10deg)' },
          '30%': { transform: 'rotate(8deg)' },
          '40%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        // Note: no `forwards`/`both` fill-mode on these. A fill-mode that holds
        // the final keyframe (e.g. `transform: translateY(0)`) after the
        // animation ends leaves a non-`none` computed transform on the element
        // forever, which makes it a CSS containing block for any descendant
        // `position: fixed` element (like our Modal) — trapping the modal
        // inside that container instead of covering the viewport. The final
        // keyframe values here are visual no-ops (translateY(0), scale(1),
        // opacity 1), so letting the animation's effects lapse afterward is
        // visually identical and avoids the containing-block trap.
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up-in': 'slideUpIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.15s ease-out',
        'overlay-in': 'overlayIn 0.15s ease-out',
        pop: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        ring: 'ring 2.2s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}

