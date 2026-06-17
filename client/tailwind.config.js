/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta oscura tipo Infloww
        ink: {
          900: '#0b0e14',
          800: '#11151f',
          700: '#161b27',
          600: '#1d2433',
          500: '#2a3346',
        },
        brand: {
          400: '#7c5cff',
          500: '#6c47ff',
          600: '#5a37e0',
        },
        accent: '#00d4ff',
      },
    },
  },
  plugins: [],
};
