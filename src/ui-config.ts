/** Shirone UI capabilities, with the existing blog's identity and fonts retained. */
export const uiConfig = {
	paletteStyle: "tonalSpot",
	colorSpec: "2025",
	background: "banner",
	texture: "starlight",
	layout: "list",
	sidebars: "dual",
	bannerImages: [] as string[],
	heroSubtitles: [] as string[],
	heroTypewriter: true,
	bannerInterval: 6000,
	announcement: "记录学习与生活，把想法慢慢变成作品。",
	startDate: "",
	article: { related: true, share: true, updatedNoticeDays: 90 },
	music: { enable: true },
	comments: {
		enable: false,
		repo: "",
		repoId: "",
		category: "",
		categoryId: "",
	},
};
