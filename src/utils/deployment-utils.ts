type BuildEnvironment = Record<string, string | undefined>;

export function getDeploymentConfig(env: BuildEnvironment) {
	const cloudflare = env.CF_PAGES === "1" || Boolean(env.CF_PAGES_URL);
	const workers = env.WORKERS_CI === "1";
	const provider = workers
		? "cloudflare-workers"
		: cloudflare
			? "cloudflare"
			: "local";
	const branch = cloudflare
		? env.CF_PAGES_BRANCH || ""
		: env.WORKERS_CI_BRANCH || env.GITHUB_REF_NAME || "";
	const commit = cloudflare
		? env.CF_PAGES_COMMIT_SHA || ""
		: env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA || "";
	const explicitSite = env.SITE_URL?.trim();
	const source =
		explicitSite ||
		(cloudflare ? env.CF_PAGES_URL : undefined) ||
		(workers ? "https://060926.xyz/" : undefined) ||
		"http://localhost:4321/";
	const site = new URL(source);
	if (
		!["http:", "https:"].includes(site.protocol) ||
		site.username ||
		site.password
	) {
		throw new Error("SITE_URL 必须是 http(s) 网站地址。");
	}
	if (
		site.hostname === "netlify.app" ||
		site.hostname.endsWith(".netlify.app")
	) {
		throw new Error("SITE_URL 请填写新的 Cloudflare 或自定义域名。");
	}
	// Cloudflare production builds may provide a per-deployment hostname.
	// Use the stable project hostname on main, unless SITE_URL explicitly names a custom domain.
	if (
		!explicitSite &&
		cloudflare &&
		branch === "main" &&
		site.hostname.endsWith(".pages.dev")
	) {
		site.hostname = site.hostname.split(".").slice(-3).join(".");
	}
	return { provider, branch, commit, site: site.href };
}
