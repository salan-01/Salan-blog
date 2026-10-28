// A reversible, scroll-scrubbed camera path. No timers or wheel interception.
export function storyFrame(progress: number, mobile = false) {
	const p = Math.max(0, Math.min(1, progress));
	const ease = (from: number, to: number) => {
		const t = Math.max(0, Math.min(1, (p - from) / (to - from)));
		return t * t * (3 - 2 * t);
	};
	const reveal = mobile ? ease(0.08, 0.4) : ease(0.15, 0.4);
	const departure = mobile ? ease(0.55, 0.88) : ease(0.58, 0.83);
	return {
		progress: p,
		// The foreground and graphic planes have independent camera paths.
		scale: mobile ? 1.18 - reveal * 0.4 + departure * 0.27 : 1.12 - reveal * 0.28 + departure * 0.2,
		x: mobile ? 16 - reveal * 28 + departure * 24 : 22 - reveal * 43 + departure * 39,
		y: mobile ? -2 - reveal * 6 + departure * 4 : 8 - reveal * 4 + departure * 3,
		rotation: -3 + reveal * 6 - departure * 4,
		palette: reveal * (1 - departure),
		intro: 1 - ease(0.12, mobile ? 0.31 : 0.27),
		middle: ease(mobile ? 0.28 : 0.25, mobile ? 0.43 : 0.4) * (1 - ease(mobile ? 0.6 : 0.58, mobile ? 0.74 : 0.71)),
		outro: ease(mobile ? 0.71 : 0.69, mobile ? 0.87 : 0.84),
	};
}
