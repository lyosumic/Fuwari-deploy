import type { APIContext } from "astro";
import { siteConfig } from "../config";
import { getSortedPosts } from "../utils/content-utils";
import { getPostUrlBySlug } from "../utils/url-utils";

const escapeXml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[char] || char,
	);
export async function GET(context: APIContext) {
	const posts = await getSortedPosts();
	const site = context.site || new URL("http://localhost:4321/");
	const updated =
		posts[0]?.data.updated || posts[0]?.data.published || new Date();
	const entries = posts
		.map((post) => {
			const href = new URL(getPostUrlBySlug(post.slug), site).href;
			return `<entry><title>${escapeXml(post.data.title)}</title><id>${escapeXml(href)}</id><link href="${escapeXml(href)}"/><published>${post.data.published.toISOString()}</published><updated>${(post.data.updated || post.data.published).toISOString()}</updated><summary>${escapeXml(post.data.description)}</summary></entry>`;
		})
		.join("");
	return new Response(
		`<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${escapeXml(siteConfig.title)}</title><id>${escapeXml(site.href)}</id><link href="${escapeXml(site.href)}"/><link href="${escapeXml(new URL("atom.xml", site).href)}" rel="self"/><updated>${updated.toISOString()}</updated>${entries}</feed>`,
		{ headers: { "Content-Type": "application/atom+xml; charset=utf-8" } },
	);
}
