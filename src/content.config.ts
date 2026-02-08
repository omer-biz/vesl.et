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
    tags: z.array(z.string()).default([]),
    categories: z.array(z.enum(["Misc", "Writeup", "Tutorial", "Hacking", "Essays"])).optional().default([])
  })
});

const words = defineCollection({
  loader: file("src/content/words.json"),
  schema: z.object({
    word: z.string(),
    meaning: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects/" }),
  schema: ({ image }) => z.object({
    name: z.string(),
    description: z.string(),
    src: z.string(),

    tech: z.array(z.string()).optional().default([]),
    demo: z.string().optional(),
    image: image().optional(),
  })
})

export const collections = { logs, words, projects };
