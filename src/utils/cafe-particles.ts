type ParticleFrame = {
	progress: number;
	x: number;
	y: number;
	intro: number;
	middle: number;
	outro: number;
	pointerX: number;
	pointerY: number;
	width: number;
	height: number;
	mobile: boolean;
	reduced: boolean;
	active: boolean;
};

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, value: number) => {
	const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
	return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scroll controls the composition. A few edge lights pass in front of the artwork. */
export function createCafeParticles(canvas: HTMLCanvasElement, foreground: HTMLCanvasElement) {
	let context: CanvasRenderingContext2D | null = null;
	try { context = canvas.getContext("2d", { alpha: true }); } catch { /* Decorative fallback. */ }
	if (!context) {
		canvas.dataset.particlesState = "unavailable";
		return { update(_frame: ParticleFrame) {} };
	}
	const ctx = context;
	let front: CanvasRenderingContext2D | null = null;
	try { front = foreground.getContext("2d", { alpha:true }); } catch { /* Main layer still works. */ }
	const colours = ["194,83,132", "207,143,50", "235,180,86"];
	// Pre-render the soft lights once; avoid per-particle blur/shadow filters.
	const lights = colours.map(colour => {
		const sprite = document.createElement("canvas");
		sprite.width = sprite.height = 32;
		const brush = sprite.getContext("2d")!;
		const glow = brush.createRadialGradient(16, 16, 0, 16, 16, 16);
		glow.addColorStop(0, "rgba(255,246,225,1)");
		glow.addColorStop(0.08, "rgba(255,235,204,1)");
		glow.addColorStop(0.2, `rgba(${colour},.95)`);
		glow.addColorStop(0.44, `rgba(${colour},.24)`);
		glow.addColorStop(1, `rgba(${colour},0)`);
		brush.fillStyle = glow;
		brush.fillRect(0, 0, 32, 32);
		return sprite;
	});
	let seed = 2718;
	const random = () => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed / 4294967296;
	};
	const points = Array.from({ length: 192 }, (_, index) => ({
		x: random(), y: random(), depth: .2 + random() * .8,
		angle: random() * TAU, phase: random() * TAU,
		colour: index % 3, ring: [1, .83, 1.12][index % 3],
	}));
	let frame: ParticleFrame;
	let request = 0;
	let lastTime = 0;
	let time = 0;
	let pixelRatio = 1;
	let width = 0;
	let height = 0;
	let small = false;
	let previousProgress = 0;
	let scrollEnergy = 0;

	function clear() {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		if (front) {
			front.setTransform(1, 0, 0, 1, 0, 0);
			front.clearRect(0, 0, foreground.width, foreground.height);
			front.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		}
	}

	function draw() {
		clear();
		const p = frame.progress;
		scrollEnergy = Math.max(scrollEnergy * .86, Math.min(1, Math.abs(p - previousProgress) * 65));
		previousProgress = p;
		const gather = smooth(.1, .48, p);
		const release = smooth(.64, .96, p);
		const fade = 1 - smooth(.79, .99, p);
		const orbit = gather * (1 - release);
		const cx = width * (.5 + frame.x * (small ? .001 : .01));
		const cy = height * ((small ? .42 : .54) + frame.y * .006);
		const radius = small ? Math.min(width * .43, height * .24) : Math.min(width * .25, height * .34);
		const count = small ? 72 : points.length;
		const rotation = time * .12 + p * TAU * .85;
		const tilt = .85 + Math.sin(p * TAU) * .09;

		// Fine incomplete arcs and little diamond markers suggest a warming spell.
		if (orbit > .01) {
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(rotation * .35);
			ctx.strokeStyle = "#b86586";
			ctx.lineWidth = small ? 1 : 1.25;
			ctx.globalAlpha = orbit * fade * .68;
			for (const ring of [.83, 1, 1.12]) {
				ctx.beginPath();
				ctx.ellipse(0, 0, radius * ring, radius * ring * tilt, 0, .1, TAU - .16);
				ctx.stroke();
			}
			// Counter-rotating bright arcs make the gathering readable while scrolling.
			for (let i = 0; i < 3; i++) {
				const start = i * TAU / 3 - rotation;
				ctx.strokeStyle = i === 1 ? "#ce9145" : "#bc567e";
				for (const [lineWidth, alpha] of [[7, .1], [2, .85]]) {
					ctx.lineWidth = lineWidth;
					ctx.globalAlpha = orbit * fade * alpha;
					ctx.beginPath();
					ctx.ellipse(0, 0, radius * 1.12, radius * 1.12 * tilt, 0, start, start + .55);
					ctx.stroke();
				}
			}
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#bd8b4b";
			ctx.globalAlpha = orbit * fade * .85;
			const markers = small ? 12 : 24;
			for (let i = 0; i < markers; i++) {
				const a = i / markers * TAU;
				const r = radius * 1.06;
				const length = i % 3 === 0 ? 7 : 3;
				ctx.beginPath();
				ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * tilt);
				ctx.lineTo(Math.cos(a) * (r + length), Math.sin(a) * (r + length) * tilt);
				ctx.stroke();
			}
			for (let i = 0; i < 6; i++) {
				const a = i / 6 * TAU;
				const x = Math.cos(a) * radius;
				const y = Math.sin(a) * radius * tilt;
				ctx.beginPath();
				ctx.moveTo(x, y - 5);
				ctx.lineTo(x + 3, y);
				ctx.lineTo(x, y + 5);
				ctx.lineTo(x - 3, y);
				ctx.closePath();
				ctx.stroke();
			}
			ctx.restore();
		}

		for (let i = 0; i < count; i++) {
			const point = points[i];
			const drift = small ? 16 : 32;
			const perspective = .7 + point.depth * .8 + smooth(0, .25, p) * point.depth * .95;
			const scatterX = width * .5 + (point.x - .5) * width * perspective + Math.sin(time * .3 + point.phase) * drift * point.depth;
			const scatterY = height * .45 + (point.y - .45) * height * perspective + Math.cos(time * .25 + point.phase) * drift - p * (small ? 210 : 420) * point.depth;
			const angle = point.angle + rotation * (point.colour === 1 ? -.7 : 1);
			const r = radius * (point.ring + Math.sin(time * .4 + point.phase) * .009);
			const ringX = cx + Math.cos(angle) * r;
			const ringY = cy + Math.sin(angle) * r * tilt;
			const convergence = smooth(.1 + (1 - point.depth) * .06, .46 + (1 - point.depth) * .05, p);
			const bend = Math.sin(convergence * Math.PI) * (small ? 65 : 150);
			let x = mix(scatterX, ringX, convergence) + Math.sin(point.phase + convergence * TAU) * bend;
			let y = mix(scatterY, ringY, convergence) + Math.cos(point.phase + convergence * TAU) * bend;
			x += Math.cos(angle) * release * radius * (.65 + point.depth * 1.7);
			y += (Math.sin(angle) * radius - 130 * point.depth) * release;
			if (!small) {
				x += frame.pointerX * 26 * point.depth;
				y += frame.pointerY * 18 * point.depth;
			}
			const size = ((small ? 9 : 12) + point.depth ** 2 * (small ? 21 : 32)) * (1 - orbit * .28);
			ctx.globalAlpha = (.65 + point.depth * .3) * (.87 + Math.sin(time * .9 + point.phase) * .12) * fade;
			const trail = scrollEnergy * (small ? 20 : 38) * point.depth * (1 - orbit * .65);
			if (trail > 1) {
				const tailX = x - Math.cos(angle) * trail;
				const tailY = y - Math.sin(angle) * trail;
				const ink = ctx.createLinearGradient(tailX, tailY, x, y);
				ink.addColorStop(0, `rgba(${colours[point.colour]},0)`);
				ink.addColorStop(1, `rgba(${colours[point.colour]},.6)`);
				ctx.strokeStyle = ink;
				ctx.lineWidth = small ? 1 : 1.4;
				ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
			}
			ctx.drawImage(lights[point.colour], x - size / 2, y - size / 2, size, size);
			if (i % 14 === 0) {
				ctx.strokeStyle = `rgb(${colours[point.colour]})`;
				ctx.lineWidth = 1.1;
				ctx.beginPath();
				ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
				ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
				ctx.stroke();
			}
		}

		// Keep navigation and the active copy quiet, without reading layout every frame.
		ctx.globalCompositeOperation = "destination-out";
		ctx.globalAlpha = 1;
		const vertical = ctx.createLinearGradient(0, 0, 0, height);
		vertical.addColorStop(0, "#000");
		vertical.addColorStop(Math.min(.18, 85 / height), "#000");
		vertical.addColorStop(small ? .22 : .2, "transparent");
		vertical.addColorStop(small ? .49 : .8, "transparent");
		vertical.addColorStop(small ? .65 : .96, "#000");
		vertical.addColorStop(1, "#000");
		ctx.fillStyle = vertical;
		ctx.fillRect(0, 0, width, height);
		if (!small) {
			const mask = ctx.createLinearGradient(0, 0, width, 0);
			const left = Math.max(frame.intro, frame.outro) * .83;
			const right = frame.middle * .83;
			mask.addColorStop(0, `rgba(0,0,0,${left})`);
			mask.addColorStop(.43, `rgba(0,0,0,${left})`);
			mask.addColorStop(.53, `rgba(0,0,0,${right})`);
			mask.addColorStop(1, `rgba(0,0,0,${right})`);
			ctx.fillStyle = mask;
			ctx.fillRect(0, 0, width, height);
		}
		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;

		// Large, fast lights stay at the edges, clear of faces and the reading column.
		if (front) {
			for (let i = 0; i < (small ? 6 : 12); i++) {
				const point = points[i * 5];
				const edge = i % 2 === 0 ? .025 : .975;
				const x = width * (edge + Math.sin(p * 8 + point.phase) * .018);
				const y = ((point.y * height - p * height * (1 + point.depth) - time * 5 + height * 5) % (height * 1.15)) - height * .05;
				const edgeFade = smooth(80, 150, y) * (1 - smooth(height * (small ? .46 : .76), height * (small ? .58 : .9), y));
				const size = (small ? 24 : 36) + point.depth * (small ? 18 : 30);
				front.globalAlpha = fade * edgeFade * (.65 - orbit * .2);
				front.drawImage(lights[point.colour], x - size / 2, y - size / 2, size, size);
			}
			front.globalAlpha = 1;
		}
	}

	function tick(now: number) {
		request = requestAnimationFrame(tick);
		if (lastTime && now - lastTime < (small ? 1000 / 30 : 1000 / 60) - 1) return;
		if (lastTime) time += Math.min(now - lastTime, 80) / 1000;
		lastTime = now;
		draw();
	}

	return {
		update(next: ParticleFrame) {
			frame = next;
			const ratio = Math.min(devicePixelRatio || 1, next.mobile ? 1.25 : 1.5, 2048 / Math.max(1, next.width, next.height));
			if (width !== next.width || height !== next.height || pixelRatio !== ratio || small !== next.mobile) {
				width = next.width; height = next.height; small = next.mobile; pixelRatio = ratio;
				canvas.width = Math.max(1, Math.round(width * pixelRatio));
				canvas.height = Math.max(1, Math.round(height * pixelRatio));
				foreground.width = canvas.width;
				foreground.height = canvas.height;
			}
			const running = next.active && !next.reduced && next.progress < .99 && width > 0 && height > 0;
			canvas.dataset.particlesState = next.reduced ? "reduced" : running ? "running" : "paused";
			if (!running) {
				cancelAnimationFrame(request);
				request = 0;
				lastTime = 0;
				clear();
			} else if (!request) {
				draw();
				request = requestAnimationFrame(tick);
			}
		},
	};
}
