import { getCollection, type CollectionEntry } from 'astro:content';
import readingTime from 'reading-time';

/** Published posts, newest first. Drafts show in `dev` but never in a build. */
export async function getPosts() {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

/** Whole minutes of reading time, floored at 1. `null` when the post has no body. */
export function getReadingMinutes(post: CollectionEntry<'blog'>) {
	return post.body ? Math.max(1, Math.round(readingTime(post.body).minutes)) : null;
}
