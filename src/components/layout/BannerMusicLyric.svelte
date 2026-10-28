<script lang="ts">
import { onMount } from "svelte";

import CurrentLyric from "@components/widgets/music-player/atoms/CurrentLyric.svelte";
import type { MusicPlayerState } from "@/stores/musicPlayerStore";
import { musicPlayerStore } from "@/stores/musicPlayerStore";

let { variant = "banner" }: { variant?: "banner" | "hero" } = $props();

let playerState: MusicPlayerState = $state(musicPlayerStore.getState());

onMount(() =>
	musicPlayerStore.subscribe((nextState) => {
		playerState = nextState;
	}),
);
</script>

{#if playerState.isPlaying && playerState.currentSong.id !== 0}
	<div class="banner-music-lyric" aria-live="off">
		<CurrentLyric
			lyricsUrl={playerState.currentSong.lyrics}
			lyricsText={playerState.currentSong.lyricsText}
			currentTime={playerState.currentTime}
			timeOffset={playerState.currentSong.lyricOffset}
			{variant}
		/>
	</div>
{/if}

<style>
	.banner-music-lyric {
		pointer-events: none;
	}
</style>
