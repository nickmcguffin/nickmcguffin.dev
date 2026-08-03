import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer } from '@astrojs/mdx/container-renderer';
import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import { getPosts } from '../lib/posts';

/**
 * Full post bodies in the feed. MDX compiles to a component rather than static
 * HTML, so there's nothing to read off the entry — it has to be rendered, and
 * the container API is the supported way to do that outside a page.
 */
export async function GET(context: APIContext) {
	const posts = await getPosts();
	const site = context.site!;

	const renderers = await loadRenderers([getContainerRenderer()]);
	const container = await AstroContainer.create({ renderers });

	const items = await Promise.all(
		posts.map(async (post) => {
			const { Content } = await render(post);
			const html = await container.renderToString(Content);

			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.published,
				link: `/blog/${post.id}/`,
				content: sanitizeHtml(html, {
					// Shiki colours tokens with inline styles, so those have to survive.
					allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
					allowedAttributes: {
						...sanitizeHtml.defaults.allowedAttributes,
						'*': ['style', 'class'],
					},
					// Feed readers resolve nothing — every URL has to be absolute.
					transformTags: {
						a: (tagName, attribs) => ({
							tagName,
							attribs: attribs.href
								? { ...attribs, href: new URL(attribs.href, site).href }
								: attribs,
						}),
						img: (tagName, attribs) => ({
							tagName,
							attribs: attribs.src ? { ...attribs, src: new URL(attribs.src, site).href } : attribs,
						}),
					},
				}),
			};
		}),
	);

	return rss({
		title: 'Nick McGuffin',
		description: 'Notes on what I build, and the parts that break.',
		site,
		items,
	});
}
