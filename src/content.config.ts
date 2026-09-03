import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const shaders = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    difficulty: z.enum(['入门', '进阶', '高级']),
    caseType: z.enum(['授权移植', '灵感重构']),
    tags: z.array(z.string().min(1)).min(1),
    source: z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      url: z.url(),
      license: z.string().min(1),
      licenseUrl: z.url(),
      evidence: z.string().min(1),
    }),
    preview: z.object({
      poster: z.string().startsWith('/'),
      loop: z.string().startsWith('/'),
      alt: z.string().min(1),
    }),
  }),
});

export const collections = { shaders };
