// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { remarkReadingTime } from './remark-reading-time.ts';

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },
    markdown: {
        remarkPlugins: [remarkReadingTime],
        shikiConfig: {
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
        },
    },
});
