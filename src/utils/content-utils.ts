import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import { isEncryptedPost } from "./post-encryption";
import { assignPostRoutes } from "./post-routes";
import { normalizeTags } from "./tags-utils";
import { normalizeTerms } from "./taxonomy-utils";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const seriesDefinitions = allBlogPosts.some((post) => post.data.series)
		? await getCollection("series")
		: [];
	const normalizedPosts = allBlogPosts.map((post) => ({
		...post,
		data: {
			...post.data,
			category: normalizeTerms(post.data.category).length
				? normalizeTerms(post.data.category)
				: normalizeTerms(
						seriesDefinitions.find((series) => series.slug === post.data.series)
							?.data.defaultCategory,
					),
			tags: normalizeTags(post.data.tags),
		},
	}));
	const sorted = normalizedPosts.sort((a, b) => {
		return (
			Number(b.data.pinned) - Number(a.data.pinned) ||
			b.data.published.getTime() - a.data.published.getTime() ||
			a.slug.localeCompare(b.slug)
		);
	});
	for (const post of sorted) isEncryptedPost(post.data);
	return assignPostRoutes(sorted);
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextUrl = sorted[i - 1].data.routeUrl;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevUrl = sorted[i + 1].data.routeUrl;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: Object.fromEntries(
			Object.entries(post.data).filter(([key]) => key !== "password"),
		) as Omit<CollectionEntry<"posts">["data"], "password">,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap = Object.create(null) as Record<string, number>;
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		normalizeTags(post.data.tags).forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getRawSortedPosts();
	const count = Object.create(null) as Record<string, number>;
	let uncategorizedCount = 0;
	allBlogPosts.forEach((post) => {
		const categories = normalizeTerms(post.data.category);
		if (!categories.length) uncategorizedCount++;
		for (const name of categories) count[name] = (count[name] || 0) + 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	if (uncategorizedCount)
		ret.push({
			name: i18n(I18nKey.uncategorized),
			count: uncategorizedCount,
			url: getCategoryUrl(null),
		});
	return ret;
}
