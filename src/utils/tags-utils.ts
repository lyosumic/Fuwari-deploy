import tagSettings from "../data/tags.json";

export interface TagAlias {
	from: string;
	to: string;
}

// Apply once to original tags: rules do not cascade or rewrite Markdown files.
export function normalizeTags(
	tags: string[],
	aliases: TagAlias[] = tagSettings.aliases,
): string[] {
	const rules = new Map<string, string>();
	for (const rule of aliases) {
		const from = rule.from.trim();
		if (!from || rules.has(from))
			throw new Error(`标签设置包含空白或重复的原标签：${from}`);
		rules.set(from, (rule.to ?? "").trim());
	}
	return [
		...new Set(
			tags
				.map((tag) => {
					const name = tag.trim();
					return rules.get(name) ?? name;
				})
				.filter(Boolean),
		),
	];
}
