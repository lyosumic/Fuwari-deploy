import type { Album } from "../types/album";
import { scanAllAlbums } from "./album-folder-scanner";
import { isEncryptedPost } from "./post-encryption";
import { getExtraEntries, safeImageUrl } from "./site-extras";
import { url } from "./url-utils";
export function getAlbums(): Album[] {
	const ids = new Set<string>();
	const folders = scanAllAlbums().map((album) => ({
		...album,
		image: album.cover,
		images: album.photos,
	}));
	return [...getExtraEntries("albums"), ...folders].map((entry) => {
		const id = (
			entry.id || entry.title.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "-")
		).trim();
		if (!id || id === "." || id === ".." || /[/\\]/.test(id) || ids.has(id))
			throw new Error("相册需要唯一且不包含路径分隔符的 id。");
		ids.add(id);
		isEncryptedPost(entry);
		return {
			...entry,
			id,
			image: safeImageUrl(entry.image),
			layout: entry.layout === "masonry" ? "masonry" : "grid",
			columns: Math.min(4, Math.max(2, Math.floor(entry.columns || 3))),
			images: (entry.images || [])
				.filter((photo) => safeImageUrl(photo.src))
				.map((photo) => ({
					...photo,
					src: safeImageUrl(photo.src) || "",
					thumbnail: safeImageUrl(photo.thumbnail),
				})),
		} as Album;
	});
}
export function albumUrl(id: string): string {
	return url(`/albums/${encodeURIComponent(id)}/`);
}
