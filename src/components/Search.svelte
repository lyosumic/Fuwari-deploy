<script lang="ts">
import Icon from "@iconify/svelte";
import { getBingTarget } from "@utils/search-utils";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

let mode: "site" | "bing" = "site";
let keyword = "";
let result: SearchResult[] = [];
let isSearching = false;
let initialized = false;
let activeScreen: "desktop" | "mobile" = "desktop";
let message = "";
let searchVersion = 0;

function showDesktopPanel(show: boolean) {
	if (activeScreen !== "desktop") return;
	document
		.getElementById("search-panel")
		?.classList.toggle("float-panel-closed", !show);
}

function toggleMode() {
	mode = mode === "site" ? "bing" : "site";
	searchVersion++;
	result = [];
	message = "";
	isSearching = false;
	showDesktopPanel(false);
}

function togglePanel() {
	activeScreen = "mobile";
	document
		.getElementById("search-panel")
		?.classList.toggle("float-panel-closed");
}

async function search(query: string) {
	const version = ++searchVersion;
	result = [];
	message = "";
	isSearching = false;
	if (mode !== "site" || !query.trim()) {
		showDesktopPanel(false);
		return;
	}
	showDesktopPanel(true);
	if (!initialized) {
		message = "正在加载站内搜索…";
		return;
	}
	if (import.meta.env.DEV) {
		message = "站内搜索请在构建后的预览或已部署网站中使用。";
		return;
	}
	if (!window.pagefind) {
		message = "站内搜索索引暂不可用，请完成网站构建后重试。";
		return;
	}
	isSearching = true;
	try {
		const response = await window.pagefind.search(query.trim());
		const results = await Promise.all(
			response.results.map((item) => item.data()),
		);
		if (version !== searchVersion) return;
		result = results;
		if (!results.length) message = "没有找到相关文章，请尝试其他关键词。";
	} catch {
		if (version !== searchVersion) return;
		message = "站内搜索暂不可用，请稍后重试。";
	} finally {
		if (version === searchVersion) isSearching = false;
	}
}

function clearSearch() {
	searchVersion++;
	keyword = "";
	result = [];
	message = "";
	isSearching = false;
	document.getElementById("search-panel")?.classList.add("float-panel-closed");
}

function openResult(event: MouseEvent, href: string) {
	event.preventDefault();
	window.open(href, "_blank", "noopener,noreferrer");
	clearSearch();
}

function submit(event: SubmitEvent) {
	event.preventDefault();
	const query = keyword.trim();
	if (!query) return;
	if (mode === "bing") {
		window.open(getBingTarget(query), "_blank", "noopener,noreferrer");
		clearSearch();
	} else {
		void search(query);
	}
}

onMount(() => {
	const ready = () => {
		initialized = true;
	};
	if (import.meta.env.DEV || window.pagefind) ready();
	document.addEventListener("pagefindready", ready);
	document.addEventListener("pagefindloaderror", ready);
	const fallback = setTimeout(ready, 2000);
	return () => {
		clearTimeout(fallback);
		document.removeEventListener("pagefindready", ready);
		document.removeEventListener("pagefindloaderror", ready);
	};
});

$: if (initialized || keyword || mode) {
	void search(keyword);
}
</script>

<form id="search-bar" class="search-field hidden lg:flex" role="search" aria-label="搜索本站或 Bing" on:submit={submit}>
  <Icon icon="material-symbols:search" class="search-icon" />
  <input name="q" aria-label={mode === "site" ? "站内搜索" : "Bing 搜索"}
    placeholder={mode === "site" ? "搜索博客文章…" : "输入网址或关键词…"}
    bind:value={keyword} on:focus={() => { activeScreen = "desktop"; void search(keyword); }} />
  <button class="scope-switch" type="button" on:click={toggleMode}
    aria-label={mode === "site" ? "切换到 Bing 搜索" : "切换到站内搜索"}
    title={mode === "site" ? "切换到 Bing 搜索" : "切换到站内搜索"} aria-pressed={mode === "bing"}>
    {mode === "site" ? "本站" : "Bing"}<Icon icon="material-symbols:swap-horiz" />
  </button>
  <button class="submit-search" type="submit" aria-label="提交搜索"><Icon icon="material-symbols:arrow-forward-rounded" /></button>
</form>

<button on:click={togglePanel} aria-label="打开搜索" id="search-switch"
  class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
  <Icon icon="material-symbols:search" class="text-[1.25rem]" />
</button>

<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem] top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">
  <form id="search-bar-inside" class="search-field mobile-search flex lg:hidden" role="search" aria-label="搜索本站或 Bing" on:submit={submit}>
    <Icon icon="material-symbols:search" class="search-icon" />
    <input name="q" aria-label={mode === "site" ? "站内搜索" : "Bing 搜索"}
      placeholder={mode === "site" ? "搜索博客文章…" : "输入网址或关键词…"}
      bind:value={keyword} on:focus={() => { activeScreen = "mobile"; }} />
    <button class="scope-switch" type="button" on:click={toggleMode}
      aria-label={mode === "site" ? "切换到 Bing 搜索" : "切换到站内搜索"} aria-pressed={mode === "bing"}>
      {mode === "site" ? "本站" : "Bing"}<Icon icon="material-symbols:swap-horiz" />
    </button>
    <button class="submit-search" type="submit" aria-label="提交搜索"><Icon icon="material-symbols:arrow-forward-rounded" /></button>
  </form>
  {#if mode === "bing"}
    <p class="px-3 py-2 text-sm text-50 lg:hidden">输入网址直接打开，输入关键词使用 Bing 搜索。</p>
  {:else if isSearching}
    <p class="px-3 py-2 text-sm text-50" role="status">正在搜索…</p>
  {:else if message}
    <p class="px-3 py-2 text-sm text-50" role="status">{message}</p>
  {/if}
  {#if mode === "site"}
    {#each result as item}
      <a href={item.url} target="_blank" rel="noopener noreferrer" data-no-swup on:click={(event) => openResult(event, item.url)} class="transition group block rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
        <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
          {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]" />
        </div>
        <div class="transition text-sm text-50">{@html item.excerpt}</div>
      </a>
    {/each}
  {/if}
</div>

<style>
  .search-field { align-items: center; gap: 8px; height: 44px; margin-right: 8px; padding: 0 8px 0 12px; border-radius: 999px; background: rgba(0,0,0,.04); color: rgba(0,0,0,.55); }
  :global(.dark) .search-field { background: rgba(255,255,255,.05); color: rgba(255,255,255,.65); }
  .search-field:focus-within { background: var(--btn-plain-bg-hover); }
  .search-field :global(.search-icon) { flex-shrink: 0; font-size: 20px; opacity: .65; }
  input { width: clamp(90px, 10vw, 130px); min-width: 0; height: 100%; background: transparent; outline: 0; font-size: 14px; transition: width 150ms; }
  input:focus { width: clamp(90px, 10vw, 130px); }
  .scope-switch { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; gap: 3px; height: 28px; padding: 0 7px; border-radius: 999px; font-size: 12px; color: var(--primary); background: var(--btn-regular-bg); }
  .scope-switch :global(svg) { font-size: 16px; }
  .submit-search { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 999px; }
  .submit-search:hover { color: var(--primary); background: var(--btn-regular-bg); }
  button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .mobile-search { margin-right: 0; }
  .mobile-search input, .mobile-search input:focus { flex: 1; width: 0; }
  .search-panel { max-height: calc(100vh - 100px); overflow-y: auto; }
</style>
