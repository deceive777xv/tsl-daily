import type { CollectionEntry } from 'astro:content';

export type ShaderEntry = CollectionEntry<'shaders'>;

export function caseSlug(entry: Pick<ShaderEntry, 'id'>): string {
  return entry.id.replace(/\/index$/, '');
}

export function sortCases(entries: ShaderEntry[]): ShaderEntry[] {
  return [...entries].sort((a, b) => {
    const dateDifference = b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
    return dateDifference || caseSlug(a).localeCompare(caseSlug(b), 'en');
  });
}

export function casePath(entry: Pick<ShaderEntry, 'id'>): string {
  return `shaders/${caseSlug(entry)}/`;
}

export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export function uniqueTags(entries: ShaderEntry[]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.data.tags))].sort((a, b) =>
    a.localeCompare(b, 'en'),
  );
}
