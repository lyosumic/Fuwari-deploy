export interface MusicTrack {
	id: string;
	title: string;
	artist?: string;
	source: string;
	cover?: string;
}
export interface MetingSource {
	api?: string;
	server?: string;
	type?: string;
	id?: string;
}
export function safeMediaUrl(value: unknown): string | undefined {
	if (typeof value !== "string" || !value.trim()) return undefined;
	const source = value.trim();
	if (
		source.startsWith("/") &&
		!source.startsWith("//") &&
		!source.includes("..")
	)
		return source;
	try {
		const url = new URL(source);
		return ["https:", "http:"].includes(url.protocol) &&
			!url.username &&
			!url.password
			? url.href
			: undefined;
	} catch {
		return undefined;
	}
}
export function normalizeMusicTracks(
	data: unknown,
	prefix = "local",
): MusicTrack[] {
	if (!Array.isArray(data)) return [];
	const tracks: MusicTrack[] = [];
	for (const [index, value] of data.entries()) {
		if (!value || typeof value !== "object") continue;
		const title =
			typeof (value.title ?? value.name) === "string"
				? (value.title ?? value.name).trim()
				: "";
		const source = safeMediaUrl(value.source ?? value.url);
		if (!title || !source) continue;
		const suppliedId =
			typeof value.id === "string" || typeof value.id === "number"
				? String(value.id).trim()
				: "";
		tracks.push({
			id: suppliedId
				? prefix === "meting"
					? `meting-${suppliedId}`
					: suppliedId
				: `${prefix}-${index}`,
			title,
			source,
			artist:
				typeof (value.artist ?? value.author) === "string"
					? (value.artist ?? value.author).trim()
					: "",
			cover: safeMediaUrl(value.cover ?? value.image ?? value.pic),
		});
	}
	return mergeMusicTracks([], tracks);
}
export function mergeMusicTracks(
	local: MusicTrack[],
	remote: MusicTrack[],
): MusicTrack[] {
	const ids = new Set<string>();
	const sources = new Set<string>();
	return [...local, ...remote].filter((track) => {
		if (ids.has(track.id) || sources.has(track.source)) return false;
		ids.add(track.id);
		sources.add(track.source);
		return true;
	});
}
export function buildMetingUrl(config: MetingSource): string | undefined {
	if (!config.id?.trim()) return undefined;
	const template =
		config.api?.trim() ||
		"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&r=:r";
	const value = template
		.replaceAll(":server", encodeURIComponent(config.server || "netease"))
		.replaceAll(":type", encodeURIComponent(config.type || "playlist"))
		.replaceAll(":id", encodeURIComponent(config.id.trim()))
		.replaceAll(":auth", "")
		.replaceAll(":r", String(Date.now()));
	const url = new URL(value);
	if (url.protocol !== "https:" || url.username || url.password)
		throw new Error("Meting API 必须使用不包含凭据的 HTTPS 地址。");
	return url.href;
}
export async function fetchMetingTracks(
	url: string,
	fetcher: typeof fetch = fetch,
): Promise<MusicTrack[]> {
	const response = await fetcher(url, { signal: AbortSignal.timeout(15000) });
	if (!response.ok) throw new Error(`Playlist HTTP ${response.status}`);
	return normalizeMusicTracks(await response.json(), "meting");
}
