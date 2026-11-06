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
        // Linear Dark System / Forensics Dark System Tokens
        primary: '#7170ff',
        secondary: '#e5e5e6',
        tertiary: '#9aa0a6',
        neutral: '#08090a',
        surface: '#0f1011',
        'on-surface': '#f7f8f8',
        error: '#ff5a67',
        border: 'rgba(255, 255, 255, 0.078)', // #ffffff14
        'border-strong': 'rgba(255, 255, 255, 0.12)', // #ffffff1f
        muted: '#8a9099',
        overlay: 'rgba(0, 0, 0, 0.4)', // #00000066
        chip: '#0b0c0d',

        // Semantic app mapping for backwards-compatibility & dynamic theme tokens
        app: {
          canvas: 'var(--bg-canvas)',
          shell: 'var(--bg-shell)',
          surface: 'var(--bg-surface)',
          'surface-hover': 'var(--bg-surface-hover)',
          border: 'var(--border-subtle)',
          'border-strong': 'var(--border-strong)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          accent: 'var(--app-accent)',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '9px',
        xl: '14px',
        full: '9999px',
      },
      spacing: {
        xs: '8px',
        sm: '20px',
        md: '30px',
        lg: '40px',
        xl: '78px',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Berkeley Mono', 'JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
