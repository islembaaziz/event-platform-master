/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefde7',
          100: '#fefbc1',
          200: '#fef686',
          300: '#fde842',
          400: '#ffd60a',
          500: '#ffeb3b', // Main yellow accent
          600: '#e6b800',
          700: '#c08c00',
          800: '#a27700',
          900: '#856200',
          950: '#4d3600',
        },
        dark: {
          DEFAULT: '#121212', // Main background
          100: '#1a1a1a',    // Card background
          200: '#2a2a2a',    // Input background
          300: '#3a3a3a',    // Border
          400: '#5a5a5a',    // Disabled text
          500: '#858585',    // Secondary text
          600: '#a3a3a3',    // Primary text
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};