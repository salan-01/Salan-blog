<script lang="ts">
import { onDestroy, onMount } from "svelte";
import Icon from "@iconify/svelte";

import type { MusicPlayerState } from "@/stores/musicPlayerStore";
import { musicPlayerStore } from "@/stores/musicPlayerStore";

import CurrentLyric from "./atoms/CurrentLyric.svelte";
import SidebarControls from "../music-sidebar/components/SidebarControls.svelte";
import SidebarCover from "../music-sidebar/components/SidebarCover.svelte";
import SidebarPlaylist from "../music-sidebar/components/SidebarPlaylist.svelte";
import SidebarProgress from "../music-sidebar/components/SidebarProgress.svelte";
import SidebarTrackInfo from "../music-sidebar/components/SidebarTrackInfo.svelte";

let playerState: MusicPlayerState = $state(musicPlayerStore.getState());
let showPlaylist = $state(false);
let unsubscribe: (() => void) | undefined;

onMount(() => {
	unsubscribe = musicPlayerStore.subscribe(nextState => { playerState = nextState; });
});

onDestroy(() => {
	unsubscribe?.();
});

function togglePlay() {
	musicPlayerStore.toggle();
}

function prev() {
	musicPlayerStore.prev();
}

function next() {
	musicPlayerStore.next();
}

function toggleMode() {
	musicPlayerStore.toggleMode();
}

function togglePlaylistView() {
	showPlaylist = !showPlaylist;
}

function playIndex(index: number) {
	musicPlayerStore.playIndex(index);
}

function seek(time: number) {
	musicPlayerStore.seek(time);
}

function toggleMute() {
	musicPlayerStore.toggleMute();
}

function setVolume(volume: number) {
	musicPlayerStore.setVolume(volume);
}
</script>

<section
	id="music-control-center"
	aria-labelledby="cafe-radio-heading"
	class="fab-music-panel card-base"
>
	<div class="fab-radio-heading">
		<span id="cafe-radio-heading">Café Radio</span>
		<button type="button" aria-label="Close player" onclick={() => { musicPlayerStore.toggleExpanded(); document.querySelector<HTMLButtonElement>(".music-fab")?.focus(); }}><Icon icon="material-symbols:close-rounded" /></button>
	</div>
	<div class="fab-music-header">
		<div class="fab-record" class:playing={playerState.isPlaying}>
		<SidebarCover
			currentSong={playerState.currentSong}
			isPlaying={playerState.isPlaying}
			isLoading={playerState.isLoading}
		/>
		</div>
		<SidebarTrackInfo
			currentSong={playerState.currentSong}
			currentTime={playerState.currentTime}
			duration={playerState.duration}
			volume={playerState.volume}
			isMuted={playerState.isMuted}
			onToggleMute={toggleMute}
			onSetVolume={setVolume}
		/>
	</div>
	<div class="fab-radio-status"><span class="radio-bars" class:playing={playerState.isPlaying} aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>{playerState.isPlaying ? "Now playing" : "On pause"}</span><span class="radio-status-line" aria-hidden="true"></span></div>

	<div class="fab-lyric-space">
	<CurrentLyric
		lyricsUrl={playerState.currentSong.lyrics}
		lyricsText={playerState.currentSong.lyricsText}
		currentTime={playerState.currentTime}
		timeOffset={playerState.currentSong.lyricOffset}
	/>
	</div>

	<SidebarProgress
		currentTime={playerState.currentTime}
		duration={playerState.duration}
		onSeek={seek}
	/>

	<SidebarControls
		isPlaying={playerState.isPlaying}
		isLoading={playerState.isLoading}
		isShuffled={playerState.isShuffled}
		repeatMode={playerState.isRepeating}
		onToggleMode={toggleMode}
		onPrev={prev}
		onNext={next}
		onTogglePlay={togglePlay}
		onTogglePlaylist={togglePlaylistView}
	/>

	<SidebarPlaylist
		playlist={playerState.playlist}
		currentIndex={playerState.currentIndex}
		isPlaying={playerState.isPlaying}
		show={showPlaylist}
		onClose={togglePlaylistView}
		onPlaySong={playIndex}
	/>
</section>

<style>
	.fab-music-panel {
		width: min(23rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 110px - env(safe-area-inset-bottom));
		overflow-y: auto; overscroll-behavior: contain;
		padding: 1.15rem;
		border-radius: 1.6rem;
		background: linear-gradient(145deg, color-mix(in srgb, var(--primary) 8%, var(--cafe-surface)), var(--cafe-surface) 65%);
		border: 1px solid var(--cafe-border);
		box-shadow: 0 24px 70px #593e4c26, 0 1px 0 #ffffff88 inset;
	}
	.fab-radio-heading { display: flex; align-items: center; justify-content: space-between; margin: -.2rem 0 1rem; color: var(--primary); font-size: .7rem; letter-spacing: .14em; }
	.fab-radio-heading button { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; transition: background .2s, transform .2s; }
	.fab-radio-heading button:hover { background: var(--btn-regular-bg); transform: rotate(90deg); }
	.fab-music-panel :global(button:focus-visible) { outline: 2px solid var(--primary); outline-offset: 3px; }
	.fab-record { position: relative; padding: 7px; border-radius: 50%; background: repeating-radial-gradient(circle, #593e4c 0 1px, #38252f 2px 3px); box-shadow: 0 5px 18px #593e4c22; flex-shrink: 0; }
	.fab-record::after { content: ""; position: absolute; width: 8px; height: 8px; background: #fff1e8; border-radius: 50%; top: 50%; left: 50%; translate: -50% -50%; box-shadow: 0 0 0 3px #49384240; pointer-events: none; }
	.fab-radio-status { display: flex; align-items: center; gap: .6rem; padding-top: .7rem; font-size: .7rem; color: var(--content-meta); }
	.radio-status-line { height: 1px; background: var(--cafe-border); flex: 1; margin-left: .5rem; }
	.radio-bars { display: flex; align-items: center; gap: 2px; height: 15px; color: var(--primary); }
	.radio-bars i { display: block; width: 2px; height: 4px; border-radius: 2px; background: currentColor; }
	.radio-bars.playing i { animation: radio-wave .8s ease-in-out infinite alternate; }
	.radio-bars i:nth-child(2) { animation-delay: -.3s; } .radio-bars i:nth-child(3) { animation-delay: -.6s; } .radio-bars i:nth-child(4) { animation-delay: -.15s; }
	.fab-lyric-space { display: grid; align-items: center; min-height: 3.5rem; margin: .75rem 0 .25rem; padding: .5rem .25rem; border-radius: .8rem; background: color-mix(in srgb, var(--primary) 5%, transparent); }
	.fab-lyric-space :global(.current-lyric) { margin: 0; white-space: normal; line-height: 1.6; font-weight: 400; overflow-wrap: anywhere; }
	.fab-music-panel :global(.controls-row) { margin-top: .6rem; }
	.fab-music-panel :global(.controls-row button) { min-height: 44px; min-width: 44px; border-radius: 50%; }
	.fab-music-panel :global(.controls-row .btn-regular) { background: var(--primary); color: var(--card-bg); box-shadow: 0 5px 16px color-mix(in srgb, var(--primary) 24%, transparent); }
	@keyframes radio-wave { to { height: 14px; } }
	@media (prefers-reduced-motion: reduce) { .radio-bars.playing i { animation: none; height: 9px; } .fab-radio-heading button { transition: none; } }

	:global(.dark) .fab-music-panel {
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
	}

	.fab-music-header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.75rem;
	}

	@media (width < 640px) {
		.fab-music-panel {
			padding: 1.05rem;
			border-radius: 1.4rem;
		}
	}
</style>
