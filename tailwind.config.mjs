/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f0f',
        sidebar: '#141414',
        card: '#1a1a1a',
        border: '#2a2a2a',
        'text-primary': '#f5f5f5',
        'text-secondary': '#9ca3af',
        indigo: { DEFAULT: '#6366f1' },
        emerald: { DEFAULT: '#10b981' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
}
