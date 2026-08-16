import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0f",
          900: "#101018",
          800: "#181824",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
