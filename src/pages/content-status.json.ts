import { getCollection } from "astro:content";
import { existsSync } from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";
import { getDeploymentConfig } from "../utils/deployment-utils";
import { getNoteUrl } from "../utils/notes-utils";
import { getProjectUrl } from "../utils/projects-utils";
import { getPostUrlBySlug } from "../utils/url-utils";

export const GET: APIRoute = async () => {
	const deployment = getDeploymentConfig(process.env);
	const [posts, notes, projects] = await Promise.all([
		getCollection("posts"),
		getCollection("notes"),
		getCollection("projects"),
	]);
	for (const entry of [...notes, ...projects]) {
		if (entry.data.draft) continue;
		const file = "pdf" in entry.data ? entry.data.pdf : entry.data.source;
		if (
			file.startsWith("/uploads/") &&
			!existsSync(path.join(process.cwd(), "public", file))
		) {
			throw new Error(
				`${entry.id}: 附件 ${file} 不存在，请在后台重新上传并保存。`,
			);
		}
	}
	const groups = { posts, notes, projects };
	const links = {
		posts: getPostUrlBySlug,
		notes: getNoteUrl,
		projects: getProjectUrl,
	};
	const content = Object.fromEntries(
		Object.entries(groups).map(([name, entries]) => [
			name,
			entries
				.filter((entry) => !entry.data.draft)
				.map((entry) => ({
					title: entry.data.title,
					url: links[name as keyof typeof links](entry.slug),
				})),
		]),
	);
	return new Response(
		JSON.stringify({
			builtAt: new Date().toISOString(),
			commit: deployment.commit,
			branch: deployment.branch,
			provider: deployment.provider,
			content,
			drafts: Object.fromEntries(
				Object.entries(groups).map(([name, entries]) => [
					name,
					entries.filter((entry) => entry.data.draft).length,
				]),
			),
		}),
		{ headers: { "Content-Type": "application/json" } },
	);
};
