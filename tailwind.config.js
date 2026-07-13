/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 知食品牌色系
        amber: {
          50: '#FAF3E7',
          100: '#F2E4C9',
          200: '#E8DCC4',
          300: '#DCC9A0',
          400: '#D4A574', // 琥珀金 · 主品牌色
          500: '#C08A55',
          600: '#A07045',
          700: '#7F5836',
          800: '#5E4127',
          900: '#3D2B19',
        },
        moss: {
          50: '#EFF3F0',
          100: '#D8E1DC',
          200: '#B0C3BA',
          300: '#88A598',
          400: '#5C8A6E',
          500: '#3F6E54',
          600: '#2F5740',
          700: '#1F3A2E', // 深墨绿 · 主品牌色
          800: '#16291F',
          900: '#0D1813',
        },
        signal: {
          safe: '#5C8A5C',   // 绿·安全
          warning: '#E6B655', // 黄·临界
          danger: '#C8553D',  // 红·超标
        },
        paper: '#FAF6EE',
        ink: '#1A1F1C',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'breathe': 'breathe 3s ease-in-out infinite',
        'ring-fill': 'ring-fill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-in': 'slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.85' },
        },
        'ring-fill': {
          '0%': { strokeDashoffset: '628' },
          '100%': { strokeDashoffset: 'var(--target-offset, 314)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
