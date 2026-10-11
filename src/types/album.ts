import type { ExtraEntry } from "../utils/site-extras";
export interface AlbumPhoto {
	id?: string;
	tags?: string[];
	width?: number;
	height?: number;
	src: string;
	thumbnail?: string;
	alt?: string;
	title?: string;
	description?: string;
	date?: string;
	location?: string;
	camera?: string;
	lens?: string;
	settings?: string;
}
export type AlbumLayout = "grid" | "masonry";
export interface AlbumGroup {
	id: string;
	title: string;
	description: string;
	cover: string;
	date: string;
	location: string;
	tags: string[];
	layout: AlbumLayout;
	columns: 2 | 3 | 4;
	hidden: boolean;
	password?: string;
	passwordHint?: string;
	photos: AlbumPhoto[];
}
export type AlbumIndexItem = Omit<AlbumGroup, "photos" | "password"> & {
	photoCount: number;
	protected: boolean;
};
export interface Album extends ExtraEntry {
	id: string;
	title: string;
	description?: string;
	image?: string;
	date?: string;
	category?: string;
	location?: string;
	tags?: string[];
	hidden?: boolean;
	password?: string;
	passwordHint?: string;
	encrypted?: boolean;
	layout: "grid" | "masonry";
	columns: number;
	images: AlbumPhoto[];
}
