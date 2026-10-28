<script lang="ts">
import { onMount } from "svelte";
import { musicPlayerStore, type MusicPlayerState } from "@/stores/musicPlayerStore";
import { showPetLyrics } from "@/utils/lyric-presentation";
import CurrentLyric from "./music-player/atoms/CurrentLyric.svelte";

let { visible, x, y, width }: { visible: boolean; x: number; y: number; width: number } = $props();
let player: MusicPlayerState = $state(musicPlayerStore.getState());
let hasPlayed = $state(false);
const showing = $derived(showPetLyrics(visible, player.isPlaying, player.isLoading));
// Subscribe to the existing audio clock; never create or play a second audio element.
onMount(() => musicPlayerStore.subscribe(state => {
	player = state;
	if (state.isPlaying) hasPlayed = true;
}));
</script>

<div class="pet-music" class:showing style:left={`${x}px`} style:top={`${y}px`} style:width={`${width}px`} aria-hidden={!showing} aria-live="off" data-no-translate>
	{#if hasPlayed}
	<CurrentLyric lyricsUrl={player.currentSong.lyrics} lyricsText={player.currentSong.lyricsText}
		currentTime={player.currentTime} timeOffset={player.currentSong.lyricOffset}
		songTitle={player.currentSong.title} artist={player.currentSong.artist} variant="pet" />
	{/if}
</div>

<style>
.pet-music { position:absolute; pointer-events:none; opacity:0; transform:translateY(5px); transition:opacity .2s,transform .2s; }
.pet-music.showing { opacity:1; transform:none; }
@media(prefers-reduced-motion:reduce) { .pet-music { transition:none; } }
</style>
