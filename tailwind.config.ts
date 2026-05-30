import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { "100": "#EA6365", DEFAULT: "#FA7275" },
        red: "#FF7474",
        error: "#b80000",
        green: "#3DD9B3",
        blue: "#56B8FF",
        pink: "#EEA8FD",
        orange: "#F9AB72",
        light: {
          "100": "#333F4E",
          "200": "#A3B2C7",
          "300": "#F2F5F9",
          "400": "#F2F4F8",
        },
        dark: { "100": "#04050C", "200": "#131524" },
      },
      fontFamily: {
        poppins: ["var(--font-poppins)"],
        dynapuff: ["var(--font-dynapuff)", "system-ui"],
      },
      boxShadow: {
        "drop-1": "0px 10px 30px 0px rgba(66, 71, 97, 0.1)",
        "drop-2": "0 8px 30px 0 rgba(250, 114, 117, 0.3)",
        "drop-3": "0 8px 30px 0 rgba(250, 114, 117, 0.1)",
        "drop-4": "0 8px 36px 0 rgba(250, 114, 117, 0.45)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        dashboardFloat: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-10px) scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        dashboardFloat: "dashboardFloat 9s ease-in-out infinite",
        "float-slow": "float 4s ease-in-out infinite",
        "float-medium": "float 3s ease-in-out infinite",
        "float-fast": "float 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
