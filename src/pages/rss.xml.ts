import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("blog");
  posts.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  return rss({
    title: "Nick McGuffin",
    description: "Notes on what I build, and the parts that break.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: `/blog/${post.id}/`,
    })),
  });
}
