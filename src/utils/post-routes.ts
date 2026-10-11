import { uiConfig } from "../ui-config.ts";

export type RoutablePost = {
	id: string;
	slug: string;
	data: {
		published: Date;
		category?: string[];
		alias?: string;
		permalink?: string;
		routeUrl?: string;
	};
};
const reserved = new Set([
	"about",
	"archive",
	"notes",
	"projects",
	"albums",
	"moments",
	"compass",
	"timeline",
	"devices",
	"skills",
	"games",
	"series",
	"tags",
	"categories",
	"admin",
	"uploads",
	"images",
	"_astro",
	"pagefind",
	"favicon",
]);
export function cleanPostPath(value: string): string {
	const clean = value.trim().replace(/^\/+|\/+$/g, "");
	if (
		!clean ||
		clean
			.split("/")
			.some(
				(part) =>
					!part ||
					part === "." ||
					part === ".." ||
					/[\\?#%]/.test(part) ||
					[...part].some((char) => char.charCodeAt(0) <= 32),
			)
	)
		throw new Error(`Invalid post path: ${value}`);
	return clean;
}
export function assignPostRoutes<T extends RoutablePost>(posts: T[]): T[] {
	const chronological = [...posts].sort(
		(a, b) =>
			a.data.published.getTime() - b.data.published.getTime() ||
			a.id.localeCompare(b.id),
	);
	const ids = new Map(chronological.map((post, index) => [post.id, index + 1]));
	const paths = new Map<string, string>();
	function claim(route: string, post: T) {
		const key = route.toLowerCase();
		const owner = paths.get(key);
		if (owner && owner !== post.id)
			throw new Error(`Post URL collision: /${route}/ (${owner}, ${post.id})`);
		paths.set(key, post.id);
	}
	for (const post of posts) claim(`posts/${post.slug}`, post);
	for (const post of posts) {
		const data = post.data;
		if (data.alias?.trim())
			claim(
				`posts/${cleanPostPath(data.alias.replace(/^\/?posts\//, ""))}`,
				post,
			);
		let custom = data.permalink?.trim();
		if (!custom && uiConfig.permalink.enable) {
			const d = data.published;
			const pad = (n: number) => String(n).padStart(2, "0");
			const tokens: Record<string, string> = {
				year: String(d.getUTCFullYear()),
				monthnum: pad(d.getUTCMonth() + 1),
				day: pad(d.getUTCDate()),
				hour: pad(d.getUTCHours()),
				minute: pad(d.getUTCMinutes()),
				second: pad(d.getUTCSeconds()),
				post_id: String(ids.get(post.id)),
				postname: post.slug,
				raw_postname: post.id.replace(/\.(md|mdx)$/i, ""),
				category: data.category?.[0] || "uncategorized",
			};
			custom = uiConfig.permalink.format.replace(
				/%([a-z_]+)%/g,
				(_, key: string) => {
					if (!(key in tokens))
						throw new Error(`Unknown permalink placeholder: ${key}`);
					return tokens[key];
				},
			);
		}
		if (custom) {
			const route = cleanPostPath(custom);
			if (
				reserved.has(route.split("/")[0].toLowerCase()) ||
				/^\d+$/.test(route) ||
				route.split("/").some((part) => /\.[a-z0-9]+$/i.test(part))
			)
				throw new Error(
					`Post permalink conflicts with a site route or file: ${route}`,
				);
			claim(route, post);
			data.routeUrl = `/${route}/`;
		} else
			data.routeUrl = data.alias?.trim()
				? `/posts/${cleanPostPath(data.alias.replace(/^\/?posts\//, ""))}/`
				: `/posts/${post.slug}/`;
	}
	return posts;
}
