/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        undc: { 50:'#e8f5e9', 100:'#c8e6c9', 200:'#a5d6a7', 300:'#81c784', 400:'#66bb6a', 500:'#2e7d32', 600:'#256a29', 700:'#1b5e20', 800:'#154b1a', 900:'#0d3311' },
        accent: { 50:'#fffbeb', 100:'#fef3c7', 500:'#f59e0b', 600:'#d97706' },
        surface: { 50:'#f8fafc', 100:'#f1f5f9' }
      },
      fontFamily: { sans:['Inter','system-ui','sans-serif'] },
      boxShadow: { card:'0 4px 24px rgba(0,0,0,0.06)', soft:'0 2px 10px rgba(0,0,0,0.04)', medium:'0 8px 32px rgba(0,0,0,0.08)', glow:'0 0 20px rgba(27,94,32,0.15)' },
      borderRadius: { '2xl':'1rem', '3xl':'1.5rem', '4xl':'2rem' },
      keyframes: {
        'fade-in': { '0%':{opacity:'0', transform:'translateY(4px)'}, '100%':{opacity:'1', transform:'translateY(0)'} },
        'shimmer': { '0%':{transform:'translateX(-100%)'}, '100%':{transform:'translateX(100%)'} }
      },
      animation: {
        'fade-in':'fade-in 0.3s ease-out',
        'shimmer':'shimmer 1.5s infinite'
      }
    }
  },
  plugins: []
}
