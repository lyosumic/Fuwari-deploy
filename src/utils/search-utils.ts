/** Resolve address-bar input to an HTTP(S) address or a Bing keyword search. */
export function getBingTarget(input: string): string {
	const query = input.trim();
	const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
	if (!query || /\s/.test(query)) return bingUrl;

	const explicitUrl = /^https?:\/\//i.test(query);
	const candidate = explicitUrl
		? query
		: query.startsWith("//")
			? `https:${query}`
			: `https://${query}`;
	try {
		const address = new URL(candidate);
		if (!["http:", "https:"].includes(address.protocol)) return bingUrl;
		if (explicitUrl) return address.href;
		// An email address is a search term, rather than a URL with a username.
		if (address.username || address.password) return bingUrl;
		const host = address.hostname;
		const isLocalAddress = host === "localhost" || /^\[.*\]$/.test(host);
		const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
		const isDomain =
			/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i.test(
				host,
			);
		return isLocalAddress || isIPv4 || isDomain ? address.href : bingUrl;
	} catch {
		return bingUrl;
	}
}
