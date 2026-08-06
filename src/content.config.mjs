import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		published: z.coerce.date(),
		tags: z.array(z.string()).optional(),
		draft: z.boolean().default(false),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		stack: z.array(z.string()),
		started: z.coerce.date(),
		url: z.url().optional(),
		repo: z.url().optional(),
	}),
});

export const collections = { blog, projects };
