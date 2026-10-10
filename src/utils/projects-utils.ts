import { type CollectionEntry, getCollection } from "astro:content";
import { url } from "./url-utils";

export type Project = CollectionEntry<"projects">;
export const projectStatuses = {
	active: "进行中",
	completed: "已完成",
	archived: "已归档",
};

export async function getProjects(): Promise<Project[]> {
	const projects = await getCollection("projects", ({ data }) => !data.draft);
	return projects.sort(
		(a, b) =>
			a.data.order - b.data.order ||
			b.data.published.getTime() - a.data.published.getTime(),
	);
}

export function getProjectUrl(slug: string): string {
	return url(`/projects/${slug.split("/").map(encodeURIComponent).join("/")}/`);
}
