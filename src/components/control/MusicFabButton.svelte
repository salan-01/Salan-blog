<script lang="ts">
import Icon from "@iconify/svelte";
import { onDestroy, onMount } from "svelte";

import type { MusicPlayerState } from "@/stores/musicPlayerStore";
import { musicPlayerStore } from "@/stores/musicPlayerStore";

let playerState = $state<MusicPlayerState>(musicPlayerStore.getState());
let unsubscribe: (() => void) | undefined;
let language = $state("en");
function syncLanguage() { language = document.documentElement.lang; }

function toggleControlCenter() {
	musicPlayerStore.toggleExpanded();
}

const currentSongTitle = $derived(
	playerState.currentSong?.title || "Café Radio",
);
const ariaLabel = $derived(
	`${language === "en" ? (playerState.isExpanded ? "Close player" : "Open player") : (playerState.isExpanded ? "收起播放器" : "打開播放器")} · ${currentSongTitle}`,
);
const statusIcon = $derived(
	playerState.isLoading
		? "svg-spinners:90-ring-with-bg"
		: "material-symbols:music-note-rounded",
);

onMount(() => {
	syncLanguage();
	document.addEventListener("mizuki:language-changed", syncLanguage);
	unsubscribe = musicPlayerStore.subscribe((nextState) => {
		playerState = nextState;
	});
});

onDestroy(() => {
	unsubscribe?.();
	if (typeof document !== "undefined") document.removeEventListener("mizuki:language-changed", syncLanguage);
});
</script>

<button
	type="button"
	class:active={playerState.isExpanded}
	class:playing={playerState.isPlaying}
	class:loading={playerState.isLoading}
	class="music-fab btn-card"
	aria-label={ariaLabel}
	aria-expanded={playerState.isExpanded}
	aria-controls="music-control-center"
	title={ariaLabel}
	onclick={toggleControlCenter}
>
	<span class="music-fab__icon" aria-hidden="true">
		<Icon icon={statusIcon} />
	</span>

	{#if playerState.isPlaying}
		<span class="music-fab__dot" aria-hidden="true"></span>
	{/if}
</button>

<style>
	.music-fab {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--fab-button-size, 3rem);
		height: var(--fab-button-size, 3rem);
		min-width: 0;
		min-height: 0;
		padding: 0.25rem;
		border: 1px solid var(--cafe-border);
		border-radius: 50%;
		background: var(--cafe-surface);
		box-shadow: 0 5px 18px #593e4c12;
		cursor: pointer;
		color: var(--primary);
		pointer-events: auto;
		transition:
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.3s ease,
			background 0.3s ease;
	}

	.music-fab:hover {
		box-shadow: var(--shadow-button);
	}

	.music-fab:active {
		transform: scale(0.94);
	}

	.music-fab.active {
		background: var(--primary); color: var(--card-bg);
	}
	.music-fab:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }

	.music-fab__icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		line-height: 1;
	}

	.music-fab__dot {
		position: absolute;
		right: 0.38rem;
		bottom: 0.38rem;
		z-index: 2;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--primary);
		box-shadow: 0 0 0 2px var(--card-bg);
	}

	.music-fab.playing::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
		animation: music-fab-pulse 1.8s ease-out infinite;
	}

	.music-fab.loading .music-fab__icon :global(svg) {
		font-size: 1.2rem;
	}

	:global(.dark) .music-fab {
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	:global(.dark) .music-fab:hover {
		box-shadow: var(--shadow-button-dark);
	}

	@keyframes music-fab-pulse {
		0% {
			opacity: 0;
			transform: scale(0.92);
		}
		30% {
			opacity: 0.75;
		}
		100% {
			opacity: 0;
			transform: scale(1.12);
		}
	}

	@media (width < 768px) {
		.music-fab {
			border-radius: 50%;
		}

		.music-fab__icon {
			font-size: 1.4rem;
		}
	}

	@media (width < 480px) {
		.music-fab {
			border-radius: 50%;
		}
	}
	@media (prefers-reduced-motion: reduce) { .music-fab { transition: none; } .music-fab.playing::after { animation: none; } }
</style>
