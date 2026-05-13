import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07111f",
          900: "#0b1729",
          850: "#10213a",
          800: "#13294b"
        },
        accent: {
          500: "#2f80ed",
          400: "#58a6ff",
          300: "#91c5ff"
        }
      },
      boxShadow: {
        finance: "0 24px 80px rgba(2, 12, 27, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
