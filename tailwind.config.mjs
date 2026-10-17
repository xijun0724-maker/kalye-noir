/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111110',
        paper: '#f4ede2',
        registration: '#c8202a',
        muted: '#6d6459',
        line: '#e2d8c8',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Anton', 'Impact', 'system-ui', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'Archivo', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};
