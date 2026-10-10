import { type CollectionEntry, getCollection } from "astro:content";
import { url } from "./url-utils";

export type Note = CollectionEntry<"notes">;

export interface NoteCategory {
	name: string;
	children: NoteCategory[];
	notes: Note[];
	count: number;
}

export async function getNotes(): Promise<Note[]> {
	const notes = await getCollection("notes", ({ data }) => !data.draft);
	return notes.sort(
		(a, b) =>
			a.data.order - b.data.order ||
			a.data.title.localeCompare(b.data.title, "zh-CN"),
	);
}

export function getNoteUrl(slug: string): string {
	return url(`/notes/${slug.split("/").map(encodeURIComponent).join("/")}/`);
}

export function buildNoteTree(notes: Note[]): NoteCategory[] {
	const roots: NoteCategory[] = [];
	for (const note of notes) {
		let siblings = roots;
		for (const [index, name] of note.data.category.entries()) {
			let category = siblings.find((item) => item.name === name);
			if (!category) {
				category = { name, children: [], notes: [], count: 0 };
				siblings.push(category);
			}
			category.count++;
			if (index === note.data.category.length - 1) category.notes.push(note);
			siblings = category.children;
		}
	}
	return roots;
}

export function categoryContains(
	category: NoteCategory,
	slug: string,
): boolean {
	return (
		category.notes.some((note) => note.slug === slug) ||
		category.children.some((child) => categoryContains(child, slug))
	);
}
