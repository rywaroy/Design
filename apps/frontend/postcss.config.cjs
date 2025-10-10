// PostCSS config for Vite + Tailwind
module.exports = {
  plugins: {
    // Tailwind CSS v4 requires the separate PostCSS plugin package
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
