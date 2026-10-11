import stored from "../data/site-extras.json";
export interface ExtraEntry {
	id: string;
	title: string;
	description?: string;
	date?: string;
	category?: string;
	url?: string;
	image?: string;
	images?: { src: string; alt?: string }[];
	content?: string;
	level?: number;
	status?: string;
	artist?: string;
	source?: string;
}
export const extraModules = {
	moments: {
		title: "动态",
		subtitle: "生活中的小事，也值得被收藏。",
		icon: "material-symbols:chat-bubble-outline-rounded",
	},
	albums: {
		title: "相册",
		subtitle: "用影像留住一些特别的时刻。",
		icon: "material-symbols:photo-library-outline-rounded",
	},
	compass: {
		title: "站点罗盘",
		subtitle: "收藏常用的网站，连接有趣的世界。",
		icon: "material-symbols:explore-outline-rounded",
	},
	timeline: {
		title: "时间线",
		subtitle: "回看走过的路，期待下一段旅程。",
		icon: "material-symbols:schedule-outline-rounded",
	},
	devices: {
		title: "我的设备",
		subtitle: "陪伴日常工作与创作的工具。",
		icon: "material-symbols:devices-outline-rounded",
	},
	skills: {
		title: "技能",
		subtitle: "保持好奇，持续学习。",
		icon: "material-symbols:school-outline-rounded",
	},
	games: {
		title: "游戏",
		subtitle: "在另一个世界，遇见新的故事。",
		icon: "material-symbols:sports-esports-outline-rounded",
	},
};
export type ExtraModule = keyof typeof extraModules;
export function getExtraEntries(module: ExtraModule): ExtraEntry[] {
	return (stored[module] as ExtraEntry[]).filter(
		(entry) => typeof entry.title === "string" && entry.title.trim(),
	);
}
export function safeExternalUrl(value?: string): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return ["http:", "https:"].includes(url.protocol) &&
			!url.username &&
			!url.password
			? url.href
			: undefined;
	} catch {
		return undefined;
	}
}
export function safeImageUrl(value?: string): string | undefined {
	return value?.startsWith("/") &&
		!value.startsWith("//") &&
		!value.includes("..")
		? value
		: safeExternalUrl(value);
}
