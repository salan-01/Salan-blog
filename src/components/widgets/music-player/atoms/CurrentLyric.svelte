<script lang="ts">
import { resolveAssetUrl } from "@/utils/asset-url";
import { isLyricCredit, isPetLyric, parseLrc, currentLyric, type LyricLine } from "@/utils/lyric-presentation";

interface Props {
	lyricsUrl?: string;
	lyricsText?: string;
	currentTime: number;
	timeOffset?: number;
	variant?: "player" | "banner" | "hero" | "pet";
	songTitle?: string;
	artist?: string;
}

let {
	lyricsUrl,
	lyricsText,
	currentTime,
	timeOffset = 0,
	variant = "player",
	songTitle = "",
	artist = "",
}: Props = $props();
let lyricLines: LyricLine[] = $state([]);

$effect(() => {
	const url = lyricsUrl;
	const embeddedLyrics = lyricsText;
	const petMode = variant === "pet";
	lyricLines = [];
	const controller = new AbortController();
	async function load() {
		try {
			let source = embeddedLyrics ?? "";
			if (!source && url) {
				const response = await fetch(resolveAssetUrl(url), { signal: controller.signal });
				if (!response.ok) throw new Error(`Lyric request failed: ${response.status}`);
				source = await response.text();
			}
			if (petMode && source) {
				const { Converter } = await import("opencc-js/cn2t");
				source = Converter({ from: "cn", to: "tw" })(source);
			}
			if (!controller.signal.aborted) lyricLines = parseLrc(source);
		} catch {
			if (!controller.signal.aborted) lyricLines = [];
		}
	}
	void load();

	return () => controller.abort();
});

const currentLine = $derived(currentLyric(lyricLines, currentTime, timeOffset));
</script>

{#if (lyricsUrl || lyricsText) && (variant !== "hero" || (currentLine && !isLyricCredit(currentLine))) && (variant !== "pet" || isPetLyric(currentLine, songTitle, artist))}
	<div
		class="current-lyric"
		class:banner={variant === "banner"}
		class:hero={variant === "hero"}
		class:pet={variant === "pet"}
		title={currentLine}
	>
		{#if variant === "pet"}
			<span class="pet-note" aria-hidden="true">♪</span><span class="pet-line">{currentLine}</span>
		{:else if variant === "hero"}
			{#key currentLine}
				<span class="hero-line"><span class="lyric-note" aria-hidden="true">♪</span><span>{currentLine}</span></span>
			{/key}
		{:else}
			{currentLine || "♪"}
		{/if}
	</div>
{/if}

<style>
	.current-lyric.pet { box-sizing:border-box; display:flex; align-items:center; justify-content:center; gap:7px; width:100%; height:64px; margin:0; padding:10px 12px; border:1px solid #e7bdcc; border-radius:18px 18px 18px 4px; background:#fff9f3f5; box-shadow:0 6px 24px #75485512; color:#684352; font-family:var(--font-sans); font-size:12px; line-height:1.55; font-weight:500; white-space:normal; }
	.pet-note { flex-shrink:0; color:var(--primary); font-size:16px; }
	.pet-line { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; overflow-wrap:anywhere; }
	:global(.dark) .current-lyric.pet { color:#f4d6e1; background:#30252ff5; border-color:#775264; }
	.current-lyric {
		min-height: 1.5rem;
		margin: -0.1rem 0 0.45rem;
		padding: 0 0.25rem;
		overflow: hidden;
		color: var(--primary);
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.5rem;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.current-lyric.banner {
		display: inline-block;
		max-width: min(90vw, 46rem);
		min-height: 2.15rem;
		margin: 0.85rem auto 0;
		padding: 0.22rem 0.9rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.28);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: rgba(255, 255, 255, 0.96);
		font-size: clamp(0.95rem, 1.35vw, 1.3rem);
		font-weight: 600;
		line-height: 1.65rem;
		text-shadow: 0 1px 5px rgba(0, 0, 0, 0.72);
	}

	.current-lyric.hero {
		display: inline-block;
		max-width: min(100%, 42rem);
		margin: 0;
		padding: .55rem 1.6rem;
		overflow: visible;
		background: radial-gradient(ellipse, #fffaf2eb 15%, #fffaf2a6 50%, #fffaf200 74%);
		color: #654653;
		font-family: var(--font-reading, sans-serif);
		font-size: clamp(.85rem, 1.25vw, 1.05rem);
		font-weight: 500;
		line-height: 1.65;
		letter-spacing: .08em;
		white-space: normal;
		text-wrap: balance;
		text-shadow: 0 1px 8px #fffaf2, 0 0 3px #fffaf2;
	}
	.hero-line { display: inline-flex; align-items: center; gap: .7rem; animation: lyric-appear .24s ease-out both; }
	.lyric-note { flex-shrink: 0; color: #b64f73; font-size: 1.15em; font-weight: 400; }
	@keyframes lyric-appear { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
	@media (prefers-reduced-motion: reduce) { .hero-line { animation: none; } }

	@media (width < 640px) {
		.current-lyric.hero { padding: .25rem .5rem; font-size: .75rem; line-height: 1.5; letter-spacing: .03em; }
		.hero-line { gap: .45rem; }
		.current-lyric.banner {
			max-width: 88vw;
			min-height: 1.85rem;
			margin-top: 0.55rem;
			padding: 0.14rem 0.7rem;
			font-size: 0.86rem;
			line-height: 1.55rem;
		}
	}
</style>
