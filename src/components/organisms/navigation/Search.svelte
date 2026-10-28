<script lang="ts">
import Icon from "@iconify/svelte";
import { navigateToPage } from "@utils/navigation-utils";
import { url } from "@utils/url-utils";
import { onMount, tick } from "svelte";
import type { SearchResult } from "@/global";

let keyword = $state("");
let result: SearchResult[] = $state([]);
let expanded = $state(false);
let panelOpen = $state(false);
let status = $state<"idle" | "loading" | "ready" | "error">("idle");
let initialized = false;
let traditional = $state(false);
let desktopInput: HTMLInputElement;
let mobileInput: HTMLInputElement;
let desktopTrigger: HTMLButtonElement;
let mobileTrigger: HTMLButtonElement;
let panel: HTMLDivElement;
let requestId = 0;
let debounceTimer: ReturnType<typeof setTimeout>;
const text = (en: string, zh: string) => traditional ? zh : en;
const desktop = () => matchMedia("(min-width: 1024px)").matches;

function showPanel(open: boolean) {
	panel?.classList.toggle("float-panel-closed", !open);
	panelOpen = open;
	if (panel) panel.inert = !open;
}
async function openSearch() {
	clearTimeout(debounceTimer);
	expanded = desktop();
	showPanel(true);
	document.getElementById("navbar-wrapper")?.classList.remove("navbar-hidden");
	window.loadPagefind?.();
	await tick();
	(desktop() ? desktopInput : mobileInput)?.focus();
	if (keyword.trim()) void search(keyword.trim());
}
function closeSearch(restoreFocus = false) {
	requestId++;
	clearTimeout(debounceTimer);
	showPanel(false);
	expanded = false;
	if (restoreFocus) (desktop() ? desktopTrigger : mobileTrigger)?.focus();
}
async function search(query: string) {
	const current = ++requestId;
	if (!query) { result = []; status = "idle"; return; }
	status = "loading";
	if (!initialized) return; // pagefindready retries the pending query.
	try {
		let matches: SearchResult[];
		if (window.pagefind) {
			const response = await window.pagefind.search(query);
			matches = await Promise.all(response.results.slice(0, 12).map(item => item.data()));
		} else if (import.meta.env.DEV) {
			matches = [{ url: url("/"), meta: { title: "Search preview" }, excerpt: "Build the site to search your published articles." }];
		} else { throw new Error("Search index unavailable"); }
		// A slower old request cannot replace newer results or reopen search.
		if (current !== requestId) return;
		result = matches;
		status = "ready";
	} catch {
		if (current !== requestId) return;
		result = [];
		status = "error";
	}
}
function selectResult(event: MouseEvent, target: string) {
	if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
	event.preventDefault();
	closeSearch();
	keyword = "";
	result = [];
	navigateToPage(target);
}
function navigateResults(event: KeyboardEvent) {
	const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>(".cafe-search-result"));
	if (!links.length) return;
	const index = links.indexOf(document.activeElement as HTMLAnchorElement);
	if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		event.preventDefault();
		const next = index < 0 ? (event.key === "ArrowDown" ? 0 : links.length - 1) :
			(index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
		links[next].focus();
	} else if (event.key === "Enter" && index < 0) {
		event.preventDefault();
		links[0].click();
	}
}
onMount(() => {
	const languageChanged = () => { traditional = document.documentElement.lang.startsWith("zh"); };
	languageChanged();
	const ready = () => { initialized = true; if (panelOpen && keyword.trim()) void search(keyword.trim()); };
	const failed = () => { initialized = true; status = "error"; };
	if (window.pagefind || import.meta.env.DEV) initialized = true;
	const keydown = (event: KeyboardEvent) => {
		const target = event.target as HTMLElement;
		const editing = !!target.closest("input, textarea, select, [contenteditable='true']");
		if ((event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) ||
			(event.key === "/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey)) {
			event.preventDefault();
			void openSearch();
		} else if (event.key === "Escape" && (panelOpen || expanded)) {
			event.preventDefault();
			closeSearch(true);
		} else if (target === desktopInput || panel.contains(target)) {
			navigateResults(event);
		}
	};
	const outside = (event: Event) => {
		const target = event.target as Node;
		if (!panel.contains(target) && !document.getElementById("search-bar")?.contains(target) && !mobileTrigger.contains(target)) closeSearch();
	};
	const focusout = () => queueMicrotask(() => {
		const target = document.activeElement;
		// Replacing a retry button or a result can temporarily return focus to
		// body. That is not an intentional keyboard departure from search.
		if (!target || target === document.body) return;
		if (!panel.contains(target) && !document.getElementById("search-bar")?.contains(target) && target !== mobileTrigger) closeSearch();
	});
	const routeChanged = () => closeSearch();
	const viewport = window.visualViewport;
	const updateViewport = () => {
		document.documentElement.style.setProperty("--cafe-visual-height", `${viewport?.height ?? innerHeight}px`);
	};
	let lastWidth = innerWidth;
	const resized = () => {
		// Mobile keyboards resize height; keep the query and panel open.
		if (Math.abs(innerWidth - lastWidth) > 40) closeSearch();
		lastWidth = innerWidth;
		updateViewport();
	};
	updateViewport();
	viewport?.addEventListener("resize", updateViewport);
	// Shared panel-manager closures must also update focusability and ARIA.
	const observer = new MutationObserver(() => {
		const open = !panel.classList.contains("float-panel-closed");
		panelOpen = open;
		panel.inert = !open;
		if (!open) { expanded = false; requestId++; }
	});
	observer.observe(panel, { attributes: true, attributeFilter: ["class"] });
	panel.inert = true;
	document.addEventListener("keydown", keydown);
	document.addEventListener("pointerdown", outside);
	document.addEventListener("focusout", focusout);
	document.addEventListener("pagefindready", ready);
	document.addEventListener("pagefindloaderror", failed);
	document.addEventListener("swup:page:view", routeChanged);
	document.addEventListener("mizuki:language-changed", languageChanged);
	window.addEventListener("resize", resized);
	return () => {
		requestId++;
		clearTimeout(debounceTimer);
		observer.disconnect();
		document.removeEventListener("keydown", keydown);
		document.removeEventListener("pointerdown", outside);
		document.removeEventListener("focusout", focusout);
		document.removeEventListener("pagefindready", ready);
		document.removeEventListener("pagefindloaderror", failed);
		document.removeEventListener("swup:page:view", routeChanged);
		document.removeEventListener("mizuki:language-changed", languageChanged);
		window.removeEventListener("resize", resized);
		viewport?.removeEventListener("resize", updateViewport);
		document.documentElement.style.removeProperty("--cafe-visual-height");
		document.getElementById("navbar")?.classList.remove("is-searching");
		const links = document.getElementById("navbar-links-container");
		if (links) links.inert = false;
	};
});
$effect(() => {
	const query = keyword.trim();
	requestId++;
	clearTimeout(debounceTimer);
	if (!query) { result = []; status = "idle"; }
	else { result = []; status = "loading"; debounceTimer = setTimeout(() => void search(query), 220); }
});
$effect(() => {
	if (typeof document !== "undefined") {
		document.getElementById("navbar")?.classList.toggle("is-searching", expanded || panelOpen);
		const links = document.getElementById("navbar-links-container");
		if (links) links.inert = expanded;
	}
});
</script>

<div id="search-bar" class="cafe-search-bar hidden lg:flex" class:expanded data-no-translate>
	<button bind:this={desktopTrigger} onclick={openSearch} aria-label={text("Search", "搜尋")}
		aria-expanded={panelOpen} aria-controls="search-panel" title={text("Search · Ctrl K or /", "搜尋 · Ctrl K 或 /")} class="btn-plain cafe-search-trigger">
		<Icon icon="material-symbols:search" class="text-[1.25rem]" />
	</button>
	<input bind:this={desktopInput} id="search-input-desktop" bind:value={keyword} type="search"
		placeholder={text("Search stories…", "搜尋故事…")} aria-label={text("Search stories", "搜尋故事")}
		aria-controls="search-panel" tabindex={expanded ? 0 : -1} onfocus={() => showPanel(true)} />
</div>
<button bind:this={mobileTrigger} onclick={() => panelOpen ? closeSearch(true) : openSearch()} data-no-translate
	aria-label={text("Search", "搜尋")} aria-expanded={panelOpen} aria-controls="search-panel" id="search-switch"
	class="btn-plain scale-animation lg:hidden! rounded-lg w-11 h-11 active:scale-95">
	<Icon icon="material-symbols:search" class="text-[1.25rem]" />
</button>
<div bind:this={panel} id="search-panel" role="region" aria-label={text("Search results", "搜尋結果")}
	class="float-panel float-panel-closed absolute top-20 left-4 md:left-[unset] right-4 z-50 search-panel cafe-search-panel">
	<div class="cafe-search-heading"><span>{text("Find a story", "尋找一篇故事")}</span>
		<button class="cafe-search-close" onclick={() => closeSearch(true)} aria-label={text("Close search", "關閉搜尋")}><Icon icon="material-symbols:close-rounded" /></button>
	</div>
	<div id="search-bar-inside" class="cafe-search-mobile lg:hidden!">
		<Icon icon="material-symbols:search" />
		<input bind:this={mobileInput} id="search-input-mobile" type="search" bind:value={keyword}
			placeholder={text("Search stories…", "搜尋故事…")} aria-label={text("Search stories", "搜尋故事")} />
	</div>
	<div class="cafe-search-status" role="status" aria-live="polite" aria-atomic="true">
		{#if status === "loading"}<span class="cafe-search-loading" aria-hidden="true"></span>{text("Searching…", "搜尋中…")}
		{:else if status === "error"}{text("Search is unavailable. Please try again.", "搜尋暫時無法使用，請再試一次。")}
			<button class="cafe-search-retry" onclick={() => { initialized = !!window.pagefind || import.meta.env.DEV; window.loadPagefind?.(); void search(keyword.trim()); }}>{text("Retry", "重試")}</button>
		{:else if status === "ready" && !result.length}{text("No stories found. Try another keyword.", "沒有找到故事，換個關鍵字試試吧。")}
		{:else if status === "idle"}{text("Stories, notes, and little discoveries.", "故事、筆記，還有日常的小發現。")}{/if}
	</div>
	<div aria-busy={status === "loading"}>
	{#each result as item}
		<a href={item.url} onclick={event => selectResult(event, item.url)} class="cafe-search-result">
			<div class="cafe-search-title">{item.meta.title}<span aria-hidden="true">↗</span></div>
			<div class="cafe-search-excerpt">{@html item.excerpt}</div>
		</a>
	{/each}
	</div>
	<div class="cafe-search-hint"><span>{text("↑ ↓ choose · Enter open", "↑ ↓ 選擇 · Enter 開啟")}</span><kbd>Esc</kbd></div>
</div>

<style>
.cafe-search-bar { position:relative; width:44px; height:44px; flex-shrink:0; }
.cafe-search-trigger { width:44px; height:44px; border-radius:12px; flex-shrink:0; z-index:1; }
.cafe-search-bar input { position:absolute; right:0; width:0; height:44px; opacity:0; pointer-events:none; border-radius:12px; background:var(--btn-plain-bg-hover); padding:0; color:var(--cafe-ink); font-size:.85rem; transition:width .25s var(--cafe-ease), opacity .2s; }
.cafe-search-bar.expanded input { width:210px; opacity:1; pointer-events:auto; padding:0 44px 0 12px; }
.cafe-search-panel { width:min(30rem, calc(100vw - 2rem)); padding:1rem; background:var(--cafe-surface) !important; border:1px solid var(--cafe-border); border-radius:20px; box-shadow:0 18px 60px #593e4c20; max-height:calc(100dvh - 110px); overflow-y:auto; color:var(--cafe-ink); }
.cafe-search-heading { display:flex; justify-content:space-between; align-items:center; color:var(--primary); font-size:.8rem; }
.cafe-search-close { display:grid; place-items:center; width:44px; height:44px; border-radius:12px; cursor:pointer; }
.cafe-search-close:hover { background:var(--btn-plain-bg-hover); }
.cafe-search-close :global(svg) { width:20px; height:20px; }
.cafe-search-mobile { display:flex; gap:.6rem; align-items:center; background:var(--btn-plain-bg-hover); border-radius:12px; padding:0 .8rem; }
.cafe-search-mobile:focus-within { box-shadow:0 0 0 2px var(--primary); }
.cafe-search-mobile input { min-width:0; width:100%; height:44px; background:transparent; font-size:.9rem; }
.cafe-search-mobile svg { flex-shrink:0; }
.cafe-search-status { display:flex; align-items:center; flex-wrap:wrap; gap:.6rem; font-size:.8rem; opacity:.8; }
.cafe-search-status:not(:empty) { padding:1rem .3rem; }
.cafe-search-retry { color:var(--primary); text-decoration:underline; min-height:44px; cursor:pointer; }
.cafe-search-result { display:block; padding:.9rem .8rem; border-radius:12px; border:1px solid transparent; transition:background .18s, border-color .18s; }
.cafe-search-result:hover, .cafe-search-result:focus-visible { background:var(--btn-plain-bg-hover); border-color:var(--cafe-border); }
.cafe-search-title { display:flex; justify-content:space-between; gap:1rem; font-size:1.05rem; line-height:1.5; }
.cafe-search-title span { color:var(--primary); }
.cafe-search-excerpt { margin-top:.3rem; font-size:.8rem; line-height:1.7; opacity:.7; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }
.cafe-search-excerpt :global(mark) { background:var(--btn-regular-bg); color:var(--primary); border-radius:3px; padding:0 2px; }
.cafe-search-hint { display:flex; justify-content:space-between; gap:1rem; border-top:1px solid var(--cafe-border); margin-top:.6rem; padding:.8rem .3rem 0; font-size:.7rem; opacity:.65; }
.cafe-search-loading { width:12px; height:12px; border:2px solid var(--cafe-border); border-top-color:var(--primary); border-radius:50%; animation:search-spin .7s linear infinite; }
:is(input, button, a):focus-visible { outline:2px solid var(--primary); outline-offset:2px; }
.cafe-search-mobile input:focus-visible { outline:none; }
@keyframes search-spin { to { rotate:360deg; } }
@media (prefers-reduced-motion:reduce) { .cafe-search-bar input, .cafe-search-result { transition:none; } .cafe-search-loading { animation:none; } }
</style>
