<script lang="ts">
import { uiConfig } from "../../ui-config";
import { MC_STYLES } from "../../utils/mc-utils";
import { getDefaultHue, getHue, setHue } from "../../utils/setting-utils";
import {
	applyUiPreferences,
	readPreference,
	savePreference,
	texturePresets,
} from "../../utils/ui-preferences";

let hue = getHue();
let style = readPreference("mc-style", uiConfig.paletteStyle);
let spec = readPreference("mc-spec", uiConfig.colorSpec);
let wallpaper = readPreference("wallpaper", uiConfig.background);
let layout = readPreference("post-layout", uiConfig.layout);
let texture = readPreference("texture", uiConfig.texture);
let reduced = readPreference("reduced-motion", "false") === "true";
const names: Record<string, string> = {
	tonalSpot: "Tonal Spot",
	vibrant: "Vibrant",
	content: "Content",
	expressive: "Expressive",
	rainbow: "Rainbow",
	fruitSalad: "Fruit Salad",
	monochrome: "Monochrome",
	neutral: "Neutral",
	fidelity: "Fidelity",
	none: "无纹理",
	starlight: "星芒光斑",
	"cyber-dots": "极客点阵",
	topography: "流光等高线",
	geometric: "几何晶体",
	sakura: "落樱微瓣",
};
function update() {
	setHue(Number(hue));
	for (const [key, value] of Object.entries({
		"mc-style": style,
		"mc-spec": spec,
		wallpaper,
		"post-layout": layout,
		texture,
		"reduced-motion": String(reduced),
	}))
		savePreference(key, value);
	applyUiPreferences();
}
function reset() {
	hue = getDefaultHue();
	style = uiConfig.paletteStyle;
	spec = uiConfig.colorSpec;
	wallpaper = uiConfig.background;
	layout = uiConfig.layout;
	texture = uiConfig.texture;
	reduced = false;
	update();
}
</script>
<section id="display-setting" class="float-panel float-panel-closed settings" aria-label="外观设置">
  <header><h2>外观设置</h2><button type="button" on:click={reset}>重置</button></header>
  <label class="setting-label" for="colorSlider">主题色 <output>{hue}</output></label>
  <input id="colorSlider" aria-label="主题色" type="range" min="0" max="360" step="1" bind:value={hue} on:input={update} />
  <label class="setting-label" for="palette-style">配色风格</label>
  <select id="palette-style" bind:value={style} on:change={update}>{#each MC_STYLES as item}<option value={item}>{names[item]}</option>{/each}</select>
  <fieldset><legend>配色规范</legend><div class="segmented"><label class:active={spec === "2021"}><input type="radio" name="color-spec" value="2021" bind:group={spec} on:change={update} />MD3 2021</label><label class:active={spec === "2025"}><input type="radio" name="color-spec" value="2025" bind:group={spec} on:change={update} />M3E 2025</label></div></fieldset>
  <fieldset><legend>页面背景</legend><div class="segmented"><label class:active={wallpaper === "none"}><input type="radio" name="wallpaper" value="none" bind:group={wallpaper} on:change={update} />纯色</label><label class:active={wallpaper === "banner"}><input type="radio" name="wallpaper" value="banner" bind:group={wallpaper} on:change={update} />横幅</label></div></fieldset>
  <fieldset><legend>文章布局</legend><div class="segmented"><label class:active={layout === "list"}><input type="radio" name="post-layout" value="list" bind:group={layout} on:change={update} />列表</label><label class:active={layout === "grid"}><input type="radio" name="post-layout" value="grid" bind:group={layout} on:change={update} />网格</label></div></fieldset>
  <label class="setting-label" for="texture-preset">背景纹理</label><select id="texture-preset" bind:value={texture} on:change={update}>{#each texturePresets as item}<option value={item}>{names[item]}</option>{/each}</select>
  <label class="reduce-motion"><input type="checkbox" bind:checked={reduced} on:change={update} />减少动态效果</label>
</section>
<style>
  .settings { position: absolute; right: 0; padding: 1.4rem; width: min(22rem, calc(100vw - 2rem)); max-height: calc(100dvh - 7rem); overflow-y: auto; color: var(--mc-on-surface); z-index: 80; }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; } h2 { font-weight: 700; font-size: 1.1rem; }
  header button { color: var(--primary); background: var(--btn-regular-bg); border-radius: 99px; padding: .3rem .7rem; font-size: .75rem; }
  .setting-label, legend { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: .8rem; margin: 1rem 0 .6rem; }
  select { width: 100%; background: var(--btn-regular-bg); color: var(--mc-on-secondary-container); border-radius: 12px; padding: .7rem; font-size: .85rem; border: 1px solid transparent; }
  input[type='range'] { width: 100%; accent-color: var(--primary); height: 1.5rem; background: linear-gradient(90deg, #fa9999, #ddd980, #81dcaa, #85b6e2, #d094df, #fa9999); border-radius: 99px; }
  .segmented { display: flex; gap: .4rem; } .segmented label { flex: 1; padding: .6rem; text-align: center; border-radius: 99px; background: var(--mc-surface-container); font-size: .8rem; cursor: pointer; }
  .segmented label.active { background: var(--mc-secondary-container); color: var(--mc-on-secondary-container); box-shadow: inset 0 0 0 1px var(--primary); }
  .segmented input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .segmented label:focus-within { outline: 2px solid var(--primary); outline-offset: 2px; }
  .reduce-motion { display: flex; gap: .6rem; margin-top: 1.2rem; align-items: center; font-size: .85rem; }
</style>
