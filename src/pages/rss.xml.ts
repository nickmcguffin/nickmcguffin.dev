import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer } from '@astrojs/mdx/container-renderer';
import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import { getPosts } from '../lib/posts';

/**
 * Trims inline styles down to what a feed reader can actually use. Two things go:
 *
 * - `--shiki-dark*`, the custom properties Shiki pairs with every light-theme
 *   colour. They only apply under the site's `.dark` class, which nothing toggles
 *   in a reader, so they are dead weight on every token.
 * - `overflow-x`, which readers override with their own `pre` styling anyway.
 *
 * Both are flagged by the W3C feed validator as suspicious style content; the
 * token colours it accepts are kept, so code stays highlighted.
 */
const DROPPED_STYLE_PREFIXES = ['--shiki-dark', 'overflow-x'];

function stripNonFeedStyles(tagName: string, attribs: sanitizeHtml.Attributes) {
	if (!attribs.style) return { tagName, attribs };

	const kept = attribs.style
		.split(';')
		.map((decl) => decl.trim())
		.filter((decl) => decl && !DROPPED_STYLE_PREFIXES.some((p) => decl.startsWith(p)));

	const next = { ...attribs };
	if (kept.length) next.style = kept.join(';');
	else delete next.style;

	return { tagName, attribs: next };
}

/**
 * Full post bodies in the feed. MDX compiles to a component rather than static
 * HTML, so there's nothing to read off the entry - it has to be rendered, and
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
					// Feed readers resolve nothing - every URL has to be absolute.
					transformTags: {
						a: (tagName, attribs) => ({
							tagName,
							attribs: attribs.href
								? { ...attribs, href: new URL(attribs.href, site).href }
								: attribs,
						}),
						pre: stripNonFeedStyles,
						code: stripNonFeedStyles,
						span: stripNonFeedStyles,
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
		// rel="self" tells a reader where the feed canonically lives, so it keeps
		// polling the right URL if the feed is ever mirrored or proxied.
		xmlns: { atom: 'http://www.w3.org/2005/Atom' },
		customData: `<atom:link href="${new URL('rss.xml', site).href}" rel="self" type="application/rss+xml"/>`,
	});
}
