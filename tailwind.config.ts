import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,elm}"
  ],
  darkMode: "class",
  theme: {
    fontFamily: {
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
      ],
    },
    extend: {
      colors: {
        gruv: {
          bg: "#f2e5bc",
          bg_alt: "#ebdbb2",
          fg: "#504945",
          fg_alt: "#7c6f64",

          bg_dark: "#282828",
          bg_alt_dark: "#32302f",
          fg_dark: "#ebdbb2",
          fg_alt_dark: "#a89984",

          red: "#9d0006",
          green: "#79740e",
          yellow: "#b57614",
          blue: "#076678",
          purple: "#8f3f71",
          aqua: "#427b58",
          orange: "#af3a03",
        },
      },
    },
  },
  plugins: [],
};

export default config;
