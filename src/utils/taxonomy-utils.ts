export type TermValue = string | readonly string[] | null | undefined;

// Legacy articles use a single category string; new articles store a list.
export function normalizeTerms(value: TermValue): string[] {
	const values = typeof value === "string" ? [value] : value || [];
	return [...new Set(values.map((name) => name.trim()).filter(Boolean))];
}

export function matchesPostFilters(
	post: { tags: TermValue; category: TermValue },
	filters: { tags: string[]; categories: string[]; uncategorized: boolean },
): boolean {
	const categories = normalizeTerms(post.category);
	return (
		(!filters.tags.length ||
			normalizeTerms(post.tags).some((tag) => filters.tags.includes(tag))) &&
		(!filters.categories.length ||
			categories.some((category) => filters.categories.includes(category))) &&
		(!filters.uncategorized || !categories.length)
	);
}
