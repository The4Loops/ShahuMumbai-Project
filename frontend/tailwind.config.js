module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
       colors: {
      dustyRose: '#D4A5A5',
      minkBrown: '#6B4226',
      softCream: '#f9f5f0',
      mutedSage: '#A3B18A',
      beige: '#fdf9f4',
      rose: '#c9a79c',
      dusty: '#b88c85',
      mocha: '#4a2d2e',
    },
    animation: {
      'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in-left': 'slideLeft 0.4s ease-out',
        'slide-in-right': 'slideRight 0.4s ease-out',
        fadeIn: "fadeIn 0.8s ease-out forwards",
        fadeUp: "fadeUp 0.8s ease-out forwards",
    },
    fontFamily: {
      serif: ['"Playfair Display"', 'serif'],
      sans: ['"Open Sans"', 'sans-serif'],
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0', transform: 'translateY(-8px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
    },ndImage: {
    'vintage-paper': "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
  },
}
  },
  plugins: [],
};
