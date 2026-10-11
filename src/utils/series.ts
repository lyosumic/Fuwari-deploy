import { getCollection } from "astro:content";
import { getSortedPosts } from "./content-utils";
import { url } from "./url-utils";
export function seriesUrl(slug: string) {
	return url(`/series/${slug.split("/").map(encodeURIComponent).join("/")}/`);
}
export async function getSeriesList() {
	const [definitions, posts] = await Promise.all([
		getCollection("series"),
		getSortedPosts(),
	]);
	const ids = new Set([
		...definitions.map((entry) => entry.slug),
		...posts.map((post) => post.data.series).filter(Boolean),
	]);
	return [...ids].map((id) => {
		const definition = definitions.find((entry) => entry.slug === id);
		return {
			id,
			title: definition?.data.title || id,
			description: definition?.data.description || "",
			status: definition?.data.status || "ongoing",
			definition,
			posts: posts
				.filter((post) => post.data.series === id)
				.sort(
					(a, b) =>
						(a.data.seriesOrder ?? Number.POSITIVE_INFINITY) -
							(b.data.seriesOrder ?? Number.POSITIVE_INFINITY) ||
						a.data.published.getTime() - b.data.published.getTime(),
				),
		};
	});
}
