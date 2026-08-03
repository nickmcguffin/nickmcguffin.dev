import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../lib/posts";

export async function GET(context: APIContext) {
  const posts = await getPosts();

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
