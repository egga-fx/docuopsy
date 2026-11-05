/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: 'var(--bg-canvas)',
          shell: 'var(--bg-shell)',
          surface: 'var(--bg-surface)',
          'surface-hover': 'var(--bg-surface-hover)',
          border: 'var(--border-subtle)',
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          accent: 'var(--app-accent)',
        },
        verdigris: {
          DEFAULT: '#0E9F8A',
          deep: '#0B7A6A',
        },
        kie: {
          violet: '#7C5CFC',
        },
        amber: {
          dirty: '#D97706',
        },
        crimson: {
          alert: '#DC2626',
        },
        emerald: {
          verified: '#059669',
        },
        // Dark Forensics Ground
        obsidian: '#0B0F14',
        slate: {
          shell: '#111722',
          surface: '#18202F',
          border: '#243044',
          muted: '#94A6BE',
        },
        parchment: {
          DEFAULT: '#ECF2F8',
        },
        // High-Contrast Light Ground
        vellum: {
          canvas: '#FAF7F0',
          shell: '#F0ECE1',
          surface: '#E5DFD0',
          border: '#CFC7B4',
        },
        forensic: {
          ink: '#12161F',
          muted: '#4A5568',
        },
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible Next', 'Segoe UI Variable Display', 'system-ui', 'sans-serif'],
        serif: ['Literata', 'Source Serif 4', 'Charter', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

