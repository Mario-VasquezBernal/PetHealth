/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Verde Veterinario
        primary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#10B981',  // Principal
          600: '#059669',  // Secundario
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',  // Texto oscuro
        },
        accent: '#34D399',
        background: '#F0FDF4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(5, 150, 105, 0.1)',
        'card-hover': '0 4px 16px rgba(5, 150, 105, 0.15)',
      },
      borderRadius: {
        'card': '16px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
}
