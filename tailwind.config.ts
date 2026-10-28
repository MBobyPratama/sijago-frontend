import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
      colors: {
        sijago: {
          primary: "#1E40AF", // Bogor Rain Blue
          civic: "#059669", // Botanical Emerald
          ai: "#4F46E5", // Luna Indigo
        },
      },
    },
  },
  plugins: [],
};

export default config;
