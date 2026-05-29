/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          900: '#0a1a0f',
          800: '#0f2416',
          700: '#163020',
        },
        gold: {
          400: '#f5c842',
          500: '#e6b020',
          600: '#c89510',
        },
        chip: {
          red: '#c0392b',
          blue: '#2980b9',
          green: '#27ae60',
          black: '#1a1a1a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'felt-texture': "radial-gradient(ellipse at 50% 0%, #163020 0%, #0a1a0f 70%)",
        'card-shine': 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'splash-pop': 'splashPop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) forwards',
        'splash-rise': 'splashRise 0.6s ease-out 0.1s both',
        'splash-letter': 'splashLetter 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'splash-underline': 'splashUnderline 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'splash-tagline': 'splashTagline 0.5s ease-out forwards',
        'splash-cursor': 'splashCursor 0.55s ease-out forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        splashPop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        splashRise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        splashLetter: {
          '0%': {
            opacity: '0',
            clipPath: 'inset(0 100% 0 0)',
            transform: 'translateY(0.12em)',
          },
          '100%': {
            opacity: '1',
            clipPath: 'inset(0 0 0 0)',
            transform: 'translateY(0)',
          },
        },
        splashUnderline: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        splashTagline: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        splashCursor: {
          '0%': { opacity: '0', transform: 'scaleY(0)' },
          '40%': { opacity: '1', transform: 'scaleY(1)' },
          '100%': { opacity: '0', transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
