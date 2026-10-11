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
	contextMenu: true,
	permalink: { enable: false, format: "%year%/%monthnum%/%postname%" },
	announcement: "记录学习与生活，把想法慢慢变成作品。",
	startDate: "",
	article: { related: true, share: true, updatedNoticeDays: 90 },
	music: {
		enable: true,
		provider: "local",
		tracks: [] as {
			id?: string;
			title: string;
			artist?: string;
			source: string;
			cover?: string;
		}[],
		meting: {
			server: "netease",
			type: "playlist",
			id: "",
			api: "",
			preload: "none",
		},
		defaultVolume: 0.7,
		defaultMode: "sequence",
	},
	comments: {
		enable: false,
		provider: "giscus",
		twikooEnvId: "",
		twikooScriptUrl:
			"https://cdn.jsdelivr.net/npm/twikoo@1.7.20/dist/twikoo.min.js",
		repo: "",
		repoId: "",
		category: "",
		categoryId: "",
	},
};
