import { defineCollection, z } from "astro:content";
import { isSafeContentUrl } from "../utils/file-utils";
import { normalizeTerms } from "../utils/taxonomy-utils";

const terms = z
	.union([z.string(), z.array(z.string()), z.null()])
	.optional()
	.transform(normalizeTerms);

const contentUrl = z
	.string()
	.default("")
	.refine(isSafeContentUrl, "请使用 /uploads/ 路径或 http(s) 链接");

const optionalDate = z.preprocess(
	(value) => (value === "" || value == null ? undefined : value),
	z.coerce.date().optional(),
);

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.coerce.date(),
		updated: optionalDate,
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: terms,
		category: terms,
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		encrypted: z.boolean().optional().default(false),
		password: z.union([z.string(), z.number()]).optional(),
		passwordHint: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		series: z.string().trim().optional().default(""),
		alias: z.string().optional().default(""),
		permalink: z.string().optional().default(""),
		routeUrl: z.string().optional(),
		prevUrl: z.string().optional(),
		nextUrl: z.string().optional(),
		seriesOrder: z.preprocess(
			(value) => (value === "" || value == null ? undefined : value),
			z.number().int().optional(),
		),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
const notesCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string().default(""),
		category: z.array(z.string().trim().min(1)).min(1),
		order: z.number().default(0),
		updated: optionalDate,
		draft: z.boolean().default(false),
		pdf: contentUrl.refine(
			(value) => !value || /\.pdf(?:[?#].*)?$/i.test(value),
			"笔记附件必须为 PDF",
		),
	}),
});

const projectsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string().default(""),
		image: z.string().default(""),
		published: z.coerce.date(),
		updated: optionalDate,
		draft: z.boolean().default(false),
		technologies: z.array(z.string()).default([]),
		status: z.enum(["active", "completed", "archived"]).default("active"),
		repository: z
			.string()
			.default("")
			.refine(
				(value) => !value || /^https?:\/\//i.test(value),
				"仓库地址必须是 http(s) 链接",
			),
		demo: z
			.string()
			.default("")
			.refine(
				(value) => !value || /^https?:\/\//i.test(value),
				"演示地址必须是 http(s) 链接",
			),
		source: contentUrl.refine(
			(value) => !value || /\.(?:zip|tar|gz|tgz|7z)(?:[?#].*)?$/i.test(value),
			"源码请上传压缩包",
		),
		order: z.number().default(0),
	}),
});

const seriesCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string().optional().default(""),
		status: z.enum(["ongoing", "completed"]).optional().default("ongoing"),
		defaultCategory: terms,
	}),
});
export const collections = {
	series: seriesCollection,
	notes: notesCollection,
	projects: projectsCollection,
	posts: postsCollection,
	spec: specCollection,
};
