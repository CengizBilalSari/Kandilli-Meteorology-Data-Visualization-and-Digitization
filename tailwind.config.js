/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Temperature color scale
        temp: {
          freezing: '#313695',
          cold: '#4575B4',
          cool: '#74ADD1',
          mild: '#ABD9E9',
          neutral: '#E0F3F8',
          warm: '#FEE090',
          hot: '#FDAE61',
          veryHot: '#F46D43',
          extreme: '#D73027',
        },
        // UI colors
        primary: '#2563EB',
        secondary: '#64748B',
      },
    },
  },
  plugins: [],
}
