import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,elm}"
  ],
  plugins: [require('@tailwindcss/typography')],
};

export default config;
