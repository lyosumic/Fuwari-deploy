// Local attachments are published from public/uploads; external URLs retain their scheme.
export function isSafeContentUrl(value: string): boolean {
	return (
		value === "" ||
		(/^https?:\/\//i.test(value) && !/[\s\\]/.test(value)) ||
		(value.startsWith("/uploads/") &&
			!/[\\?#]/.test(value) &&
			!value.split("/").some((part) => /^(\.|%2e){1,2}$/i.test(part)))
	);
}

export function attachmentUrl(value: string): string {
	return /^https?:\/\//i.test(value)
		? value
		: `${import.meta.env.BASE_URL.replace(/\/$/, "")}${value}`;
}
