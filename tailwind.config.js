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
          bg: "#0a0a0a",
          card: "#121212",
          border: "#262626",
          red: "#8b0000",
          "red-light": "#a51c1c",
          gold: "#c9a227",
          bone: "#e8e6e1",
          gray: "#404040",
          "gray-dark": "#1a1a1a",
          "gray-light": "#a3a3a3",
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-red': 'glowRed 2s ease-in-out infinite alternate',
        'branding-flash': 'brandingFlash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'system-slide': 'systemSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        glowRed: {
          '0%': { filter: 'drop-shadow(0 0 2px rgba(139, 0, 0, 0.5))' },
          '100%': { filter: 'drop-shadow(0 0 15px rgba(165, 28, 28, 0.9))' },
        },
        brandingFlash: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1) drop-shadow(0 0 5px rgba(165, 28, 28, 0.7))' },
          '30%': { transform: 'scale(1.15)', filter: 'brightness(2.5) drop-shadow(0 0 35px rgba(239, 68, 68, 1))' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1) drop-shadow(0 0 5px rgba(165, 28, 28, 0.7))' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        systemSlide: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
