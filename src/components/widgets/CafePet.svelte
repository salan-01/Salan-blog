<script lang="ts">
import { onMount, tick } from "svelte";
import PetMusicLyric from "./PetMusicLyric.svelte";
import { updatePetFacing, type PetFacing } from "@/utils/pet-motion";
import { layoutPet, keepPetAtEdge, type PetViewport, type PetPose } from "@/utils/pet-layout";

let ready = $state(false);
let compact = $state(false);
let english = $state(true);
let blocked = $state(false);
let resting = $state(false);
let x = $state(16);
let y = $state(100);
let viewport: PetViewport = { left: 0, top: 0, width: 390, height: 800 };
let speechX = $state(6), speechY = $state(6), speechWidth = $state(196);
let foldX = $state(0), foldY = $state(0);
let line = $state(-1);
let hopping = $state(false);
let dragging = $state(false);
let running = $state(false);
let runReady = $state(false);
let facing = $state<PetFacing>("right");
let directionAnchor = 0;
let runTimer: ReturnType<typeof setTimeout> | undefined;
let actor: HTMLButtonElement;
let launcher: HTMLButtonElement;
let lastLine = -1;
let timer: ReturnType<typeof setTimeout> | undefined;
let hopTimer: ReturnType<typeof setTimeout> | undefined;
let welcomeTimer: ReturnType<typeof setTimeout> | undefined;
let welcomePending = false;
let origin: { id:number; x:number; y:number; left:number; top:number } | null = null;
let moved = false;
const lines = [
	["Welcome in. Your usual seat is waiting ♡", "歡迎光臨，替你留好位置啦 ♡"],
	["One pancake break? On the house!", "要不要休息一下？鬆餅剛剛烤好！"],
	["I'll keep you company while you read.", "你慢慢看，我在這裡陪你。"],
	["A tiny bit of sweetness for your day.", "今天也要給自己留一點甜。"],
];
const message = $derived(line < 0 ? "" : lines[line][english ? 0 : 1]);
const label = (en:string, zh:string) => english ? en : zh;

function currentPose(): PetPose { return compact ? "star" : running && runReady ? facing : "idle"; }
function constrain() {
	const visual = window.visualViewport;
	viewport = { left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0,
		width: visual?.width ?? window.innerWidth, height: visual?.height ?? window.innerHeight };
	const result = layoutPet({ x, y }, currentPose(), viewport);
	({ x, y, speechX, speechY, speechWidth, foldX, foldY } = result);
}
function clearSpeech() { clearTimeout(timer); clearTimeout(hopTimer); line = -1; hopping = false; }
function cancelWelcome() {
	welcomePending = false;
	clearTimeout(welcomeTimer);
	welcomeTimer = undefined;
}
function speak(index:number) {
	clearSpeech();
	line = index;
	hopping = true;
	hopTimer = setTimeout(() => { hopping = false; }, 1800);
	timer = setTimeout(() => { line = -1; }, 5500);
}
async function fold(value:boolean) {
	endDrag();
	cancelWelcome();
	const oldSize = compact ? 52 : 136;
	compact = value;
	const newSize = value ? 52 : 136;
	if (value) {
		// Always dock the star at the default lower-left position, not the last drag.
		x = viewport.left + 16;
		y = viewport.top + viewport.height;
	} else {
		x += (oldSize - newSize) / 2;
		y += oldSize - newSize;
	}
	clearSpeech(); constrain();
	await tick();
	(value ? launcher : actor)?.focus({ preventScroll:true });
}
function greet() {
	if (moved) { moved = false; return; }
	cancelWelcome();
	lastLine = (lastLine + 1) % lines.length;
	speak(lastLine);
}
function startDrag(event: PointerEvent) {
	if (event.button !== 0 || !event.isPrimary) return;
	moved = false;
	directionAnchor = event.clientX;
	origin = { id:event.pointerId, x:event.clientX, y:event.clientY, left:x, top:y };
	(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function moveDrag(event: PointerEvent) {
	if (!origin || origin.id !== event.pointerId) return;
	const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
	if (Math.hypot(dx, dy) > 6) moved = true;
	if (moved) {
		if (!dragging) { cancelWelcome(); clearSpeech(); clearTimeout(runTimer); }
		dragging = true;
		// A grabbed companion keeps running until release, even with no pointer motion.
		running = true;
		const next = updatePetFacing(facing, directionAnchor, event.clientX);
		facing = next.facing; directionAnchor = next.anchorX;
		x = origin.left + dx; y = origin.top + dy; constrain();
	}
}
function stopRun() {
	clearTimeout(runTimer);
	if (running) {
		const position = keepPetAtEdge({ x, y }, currentPose(), compact ? "star" : "idle", viewport);
		x = position.x; y = position.y;
	}
	running = false;
	constrain();
}
function pulseRun() {
	clearTimeout(runTimer);
	running = true;
	constrain();
	if (!dragging) runTimer = setTimeout(stopRun, 140);
}
function endDrag() { origin = null; dragging = false; stopRun(); }
function keyMove(event: KeyboardEvent) {
	const delta:Record<string,number[]> = { ArrowLeft:[-16,0], ArrowRight:[16,0], ArrowUp:[0,-16], ArrowDown:[0,16] };
	if (delta[event.key]) {
		event.preventDefault(); cancelWelcome(); clearSpeech();
		const previousX = x;
		x += delta[event.key][0]; y += delta[event.key][1]; constrain();
		if (x !== previousX) { facing = x < previousX ? "left" : "right"; pulseRun(); }
	}
}
onMount(() => {
	welcomePending = true;
	let artworkReady = false;
	let disposed = false;
	const tryWelcome = () => {
		if (disposed || !welcomePending || !artworkReady || document.hidden || blocked || welcomeTimer !== undefined) return;
		welcomeTimer = setTimeout(() => {
			welcomeTimer = undefined;
			if (disposed || !welcomePending || document.hidden || blocked) return;
			welcomePending = false;
			speak(0);
		}, 650);
	};
	// A new visit always starts with the character, including on phones.
	// Folding remains local to this visit, across Swup page navigation.
	compact = false;
	y = window.innerHeight;
	constrain(); ready = true;
	const syncPage = () => {
		english = document.documentElement.lang.startsWith("en");
		blocked = document.documentElement.classList.contains("cafe-mobile-menu-open");
		resting = document.hidden;
		if (resting || blocked) endDrag();
		tryWelcome();
	};
	const escape = (event:KeyboardEvent) => { if (event.key === "Escape" && !compact && actor?.closest(".cafe-pet")?.contains(document.activeElement)) void fold(true); };
	const navigated = () => { endDrag(); clearSpeech(); syncPage(); constrain(); };
	const returned = (event: PageTransitionEvent) => {
		if (!event.persisted) return;
		// Back/forward cache restores the existing component without mounting again.
		endDrag(); cancelWelcome(); clearSpeech();
		compact = false; welcomePending = true;
		constrain(); syncPage();
	};
	const observer = new MutationObserver(syncPage);
	observer.observe(document.documentElement, { attributes:true, attributeFilter:["class", "lang"] });
	syncPage();
	// Wait for the sprite so a slow connection doesn't show a disembodied greeting.
	const artwork = new Image();
	artwork.onload = () => { artworkReady = true; tryWelcome(); };
	artwork.src = "/assets/pet/nozomi-sprites-v2.webp";
	const runArtwork = new Image();
	runArtwork.onload = () => { if (!disposed) { runReady = true; constrain(); } };
	runArtwork.src = "/assets/pet/nozomi-run-v1.webp";
	window.addEventListener("resize", constrain);
	window.visualViewport?.addEventListener("resize", constrain);
	window.visualViewport?.addEventListener("scroll", constrain);
	window.addEventListener("blur", endDrag);
	window.addEventListener("pageshow", returned);
	document.addEventListener("keydown", escape);
	document.addEventListener("visibilitychange", syncPage);
	document.addEventListener("swup:page:view", navigated);
	return () => {
		disposed = true; artwork.onload = null; runArtwork.onload = null;
		endDrag();
		observer.disconnect(); cancelWelcome(); clearSpeech();
		window.removeEventListener("resize", constrain);
		window.visualViewport?.removeEventListener("resize", constrain);
		window.visualViewport?.removeEventListener("scroll", constrain);
		window.removeEventListener("blur", endDrag);
		window.removeEventListener("pageshow", returned);
		document.removeEventListener("keydown", escape);
		document.removeEventListener("visibilitychange", syncPage);
		document.removeEventListener("swup:page:view", navigated);
	};
});
</script>

{#if ready}
<aside class="cafe-pet" class:compact class:dragging class:resting class:blocked inert={blocked} style:--pet-x={`${x}px`} style:--pet-y={`${y}px`} data-no-translate aria-label={label("Café companion", "喫茶店桌寵")}>
	<PetMusicLyric visible={!compact && line < 0 && !dragging && !blocked && !resting} x={speechX} y={speechY} width={speechWidth} />
	<div class="pet-speech" style:left={`${speechX}px`} style:top={`${speechY}px`} style:width={`${speechWidth}px`} class:visible={line >= 0} role="status" aria-live="polite">{message}</div>
	{#if compact}
		<button bind:this={launcher} class="pet-launcher" class:hopping type="button" aria-label={label("Open café companion", "展開桌寵")} onclick={() => fold(false)}>
			<svg class="pet-star" width="38" height="38" viewBox="0 0 48 48" fill="none" aria-hidden="true">
				<path d="M24 3C27 17 31 21 45 24C31 27 27 31 24 45C21 31 17 27 3 24C17 21 21 17 24 3Z" fill="#FFD76A" stroke="#D79B2E" stroke-width="1.25" stroke-linejoin="round" />
				<path d="M24 9C24 19 19 24 9 24C19 21 21 19 24 9Z" fill="#FFF5BF" />
			</svg>
		</button>
	{:else}
		<button bind:this={actor} type="button" class="pet-actor" class:hopping aria-label={label("Say hello. Drag or use arrow keys to move.", "打個招呼。拖曳或使用方向鍵移動。")} title={label("Click to chat · Drag to move", "點一下聊天 · 拖曳移動")} onpointerdown={startDrag} onpointermove={moveDrag} onpointerup={endDrag} onpointercancel={() => { moved = true; endDrag(); }} onlostpointercapture={endDrag} onkeydown={keyMove} onclick={greet}>
			<span class="pet-sprite" class:running={running && runReady} class:face-left={running && facing === "left"} data-motion={running && runReady ? "run" : "idle"} data-facing={facing} aria-hidden="true"></span>
		</button>
		<button class="pet-fold" style:left={`${foldX}px`} style:top={`${foldY}px`} type="button" aria-label={label("Minimize companion", "收回桌寵")} title={label("Minimize to a star", "收回成小星星")} onclick={() => fold(true)}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 9 5 5 5-5M7 18h10" /></svg>
		</button>
	{/if}
</aside>
{/if}

<style>
.cafe-pet { position:fixed; inset:0; z-index:60; overflow:clip; pointer-events:none; color:#684352; font-family:var(--font-sans); }
.cafe-pet.blocked { visibility:hidden; }
button { pointer-events:auto; -webkit-tap-highlight-color:transparent; }
button:focus-visible { outline:2px solid var(--primary); outline-offset:3px; border-radius:16px; }
.pet-speech { height:64px; box-sizing:border-box; padding:10px 14px; display:flex; justify-content:center; align-items:center; text-align:center; font-size:12px; line-height:1.55; font-weight:500; border:1px solid #e7bdcc; border-radius:18px 18px 18px 4px; background:#fff9f3f5; box-shadow:0 6px 24px #75485512; opacity:0; transform:translateY(5px); transition:opacity .2s,transform .2s; }
.pet-speech.visible { opacity:1; transform:none; }
.pet-speech { position:absolute; }
.pet-actor { position:absolute; left:var(--pet-x); top:var(--pet-y); display:block; width:136px; height:136px; margin:0; padding:0; background:none; border:0; touch-action:none; user-select:none; cursor:grab; }
.pet-sprite { display:block; background-image:url('/assets/pet/nozomi-sprites-v2.webp'); background-size:400% 200%; background-position:0 0; background-repeat:no-repeat; pointer-events:none; }
.pet-sprite { width:100%; height:100%; animation:pet-idle 4s step-end infinite; }
.dragging .pet-actor { cursor:grabbing; }
.pet-actor.hopping .pet-sprite { animation:pet-wave .9s step-end 2; }
.pet-actor .pet-sprite.running { background-image:url('/assets/pet/nozomi-run-v1.webp'); animation:pet-run .64s step-end infinite; }
.pet-sprite.face-left { transform:scaleX(-1); }
.resting .pet-sprite, .blocked .pet-sprite { animation-play-state:paused; }
.pet-fold { position:absolute; width:44px; height:44px; display:grid; place-items:center; padding:0; color:inherit; border:0; background:transparent; cursor:pointer; }
.pet-fold svg { opacity:.58; transition:opacity .18s,transform .18s; filter:drop-shadow(0 1px 2px #fff9f3); }
.pet-fold:hover svg, .pet-fold:focus-visible svg { opacity:1; transform:translateY(2px); }
.pet-fold:active svg { transform:translateY(3px) scale(.9); }
.pet-launcher { position:absolute; left:var(--pet-x); top:var(--pet-y); width:52px; height:52px; display:grid; place-items:center; padding:0; border:0; background:transparent; cursor:pointer; }
.pet-star { pointer-events:none; filter:drop-shadow(0 3px 6px #B87A2530); transition:transform .2s; }
.pet-launcher:hover .pet-star { transform:scale(1.1) rotate(8deg); }
.pet-launcher:active .pet-star { transform:scale(.94); }
:global(.dark) .cafe-pet { color:#f4d6e1; }
:global(.dark) .pet-speech { background:#30252ff5; border-color:#775264; }
:global(.dark) .pet-fold svg { filter:drop-shadow(0 1px 2px #30252f); }
@keyframes pet-idle {
	0%,100% { background-position:0 0; }
	86% { background-position:33.333333% 0; }
	89% { background-position:66.666667% 0; }
	93% { background-position:100% 0; }
}
@keyframes pet-wave {
	0% { background-position:0 100%; }
	20%,60% { background-position:33.333333% 100%; }
	40%,80% { background-position:66.666667% 100%; }
	95%,100% { background-position:100% 100%; }
}
@keyframes pet-run {
	0%,100% { background-position:0 0; }
	12.5% { background-position:33.333333% 0; }
	25% { background-position:66.666667% 0; }
	37.5% { background-position:100% 0; }
	50% { background-position:0 100%; }
	62.5% { background-position:33.333333% 100%; }
	75% { background-position:66.666667% 100%; }
	87.5% { background-position:100% 100%; }
}
@media(prefers-reduced-motion:reduce) { .pet-sprite, .pet-actor.hopping .pet-sprite, .pet-actor .pet-sprite.running { animation:none; } .pet-speech, .pet-star, .pet-fold svg { transition:none; } }
@media print { .cafe-pet { display:none; } }
</style>
