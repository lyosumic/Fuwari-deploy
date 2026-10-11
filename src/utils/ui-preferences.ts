import { uiConfig } from "../ui-config";
import {
	MC_STYLES,
	type McSpec,
	type McStyle,
	resolveScheme,
} from "./mc-utils";

export const texturePresets = [
	"none",
	"starlight",
	"cyber-dots",
	"topography",
	"geometric",
	"sakura",
] as const;
export function colorVariables(
	hue: number,
	dark: boolean,
	style: McStyle,
	spec: McSpec,
) {
	return Object.fromEntries(
		Object.entries(resolveScheme(hue, dark, style, spec))
			.filter(([, value]) => value)
			.map(([role, value]) => [
				`--mc-${role.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`,
				value as string,
			]),
	);
}
export function readPreference(key: string, fallback: string): string {
	try {
		return localStorage.getItem(key) || fallback;
	} catch {
		return fallback;
	}
}
export function savePreference(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* Preferences still work for this page in private storage modes. */
	}
}
export function applyUiPreferences() {
	const root = document.documentElement;
	const savedHue = Number.parseInt(root.style.getPropertyValue("--hue"), 10);
	const hue = Number.isFinite(savedHue) ? savedHue : 250;
	const savedStyle = readPreference("mc-style", uiConfig.paletteStyle);
	const style = MC_STYLES.includes(savedStyle as McStyle)
		? (savedStyle as McStyle)
		: "tonalSpot";
	const spec =
		readPreference("mc-spec", uiConfig.colorSpec) === "2021" ? "2021" : "2025";
	for (const [key, value] of Object.entries(
		colorVariables(hue, root.classList.contains("dark"), style, spec),
	))
		root.style.setProperty(key, value);
	const wallpaper =
		document.getElementById("config-carrier")?.dataset.banner === "false"
			? "none"
			: readPreference("wallpaper", uiConfig.background);
	root.dataset.wallpaper = wallpaper === "none" ? "none" : "banner";
	root.dataset.postLayout =
		readPreference("post-layout", uiConfig.layout) === "grid" ? "grid" : "list";
	const texture = readPreference("texture", uiConfig.texture);
	root.dataset.texture = texturePresets.includes(
		texture as (typeof texturePresets)[number],
	)
		? texture
		: "none";
	root.dataset.reducedMotion = readPreference("reduced-motion", "false");
	document.dispatchEvent(new CustomEvent("ui:preferences"));
}
