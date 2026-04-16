import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          white: '#FFFFFF',
          red: '#CC0000',
          'red-bright': '#FF1A1A',
          'red-dark': '#8B0000',
          gray: {
            100: '#F0F0F0',
            200: '#D6D6D6',
            300: '#ADADAD',
            400: '#858585',
            500: '#5C5C5C',
            600: '#3D3D3D',
            700: '#2E2E2E',
            800: '#1A1A1A',
            900: '#0D0D0D',
          },
          accent: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bid-flash': 'bidFlash 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        bidFlash: {
          '0%': { backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' },
          '100%': { backgroundColor: 'transparent', color: 'inherit' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
