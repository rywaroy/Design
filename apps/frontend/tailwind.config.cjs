/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  // Disable preflight to avoid conflicts with Ant Design's global styles
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
