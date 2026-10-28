<script lang="ts">
interface Props {
	currentTime: number;
	duration: number;
	onSeek: (time: number) => void;
}

const { currentTime, duration, onSeek }: Props = $props();

const progressPercent = $derived(
	duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0,
);

const formatTime = (time: number) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`;
</script>

<div class="sidebar-progress-wrapper">
	<input type="range" min="0" max={Math.max(1, duration)} step="1"
		class="sidebar-progress-bar"
		value={Math.min(currentTime, duration)} disabled={duration <= 0}
		oninput={(event) => onSeek(Number(event.currentTarget.value))}
		aria-label="Music progress"
		aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
		style={`--progress: ${progressPercent}%`}
	/>
</div>

<style>
	.sidebar-progress-wrapper {
		display: flex; align-items: center; min-height: 36px;
	}

	.sidebar-progress-bar {
		appearance: none; width: 100%; height: 36px; margin: 0; padding: 0;
		background: transparent; cursor: pointer; touch-action: pan-y; accent-color: var(--primary);
	}
	.sidebar-progress-bar::-webkit-slider-runnable-track { height: 4px; border-radius: 99px; background: linear-gradient(to right, var(--primary) var(--progress), var(--btn-regular-bg) var(--progress)); }
	.sidebar-progress-bar::-moz-range-track { height: 4px; border-radius: 99px; background: var(--btn-regular-bg); }
	.sidebar-progress-bar::-moz-range-progress { height: 4px; border-radius: 99px; background: var(--primary); }
	.sidebar-progress-bar::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; margin-top: -5px; border: 3px solid var(--card-bg); border-radius: 50%; background: var(--primary); box-shadow: 0 0 0 1px var(--cafe-border); }
	.sidebar-progress-bar::-moz-range-thumb { width: 8px; height: 8px; border: 3px solid var(--card-bg); border-radius: 50%; background: var(--primary); }
	.sidebar-progress-bar:disabled { opacity: .5; cursor: default; }

	.sidebar-progress-bar:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
</style>
