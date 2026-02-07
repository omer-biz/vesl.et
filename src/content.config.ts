import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const logs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/logs/" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(true),

    heroImage: image().optional(),
    updatedDate: z.coerce.date().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  })
});

const words = defineCollection({
  loader: file("src/content/words.json"),
  schema: z.object({
    word: z.string(),
    meaning: z.string(),
  }),
});

export const collections = { logs, words };
