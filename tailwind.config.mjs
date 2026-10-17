/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090f',
          900: '#0c1018',
          800: '#141a26',
          700: '#1e2636',
          600: '#3a4558',
          400: '#8b95a8',
          300: '#b8c0d0',
          100: '#eef1f6',
        },
        // Kept as "ember" for existing class names; values are gold (mock accent).
        ember: {
          DEFAULT: '#c9a96e',
          dim: '#8a7340',
          bright: '#e0c48a',
        },
        gold: {
          DEFAULT: '#c9a96e',
          bright: '#e0c48a',
          dim: '#8a7340',
        },
        arcane: {
          DEFAULT: '#3d85c6',
          soft: 'rgba(61, 133, 198, 0.35)',
        },
        tree: {
          arms: '#8b5a2b',
          fury: '#a33b3b',
          protection: '#3d6b8a',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.05), 0 12px 32px rgba(0,0,0,0.45)',
        glow: '0 0 24px rgba(61, 133, 198, 0.45)',
        'gold-soft': '0 0 20px rgba(201, 169, 110, 0.25)',
      },
      backgroundImage: {
        'site-glow':
          'radial-gradient(ellipse 70% 45% at 50% -15%, rgba(61,133,198,0.14), transparent), radial-gradient(ellipse 50% 35% at 90% 0%, rgba(201,169,110,0.08), transparent)',
        'hero-veil':
          'linear-gradient(180deg, rgba(7,9,15,0.55) 0%, rgba(7,9,15,0.35) 40%, rgba(7,9,15,0.85) 78%, #07090f 100%)',
      },
      maxWidth: {
        site: '72rem',
      },
    },
  },
  plugins: [],
};
