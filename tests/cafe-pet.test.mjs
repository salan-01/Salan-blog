import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { updatePetFacing } from "../src/utils/pet-motion.ts";
import { layoutPet, keepPetAtEdge, petBounds, PET_EDGE_GAP } from "../src/utils/pet-layout.ts";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const pet = await readFile(new URL("../src/components/widgets/CafePet.svelte", import.meta.url), "utf8");
const settings = await readFile(new URL("../src/components/features/settings/SettingsPanel.svelte", import.meta.url), "utf8");

test("companion cannot be disabled by the legacy preference or settings", () => {
	assert.doesNotMatch(pet, /isPetEnabled|setPetEnabled|PET_EVENT|localStorage|function close\(/);
	assert.match(pet, /\{#if ready\}/);
	assert.doesNotMatch(settings, /CafePetToggle|hasPetSettings/);
});

test("minimize leaves an accessible golden four-point star and can restore the pet", () => {
	assert.match(pet, /aria-label=\{label\("Open café companion"/);
	assert.match(pet, /onclick=\{\(\) => fold\(false\)\}/);
	assert.match(pet, /onclick=\{\(\) => fold\(true\)\}/);
	assert.match(pet, /class="pet-star"/);
	assert.match(pet, /fill="#FFD76A"/);
	assert.doesNotMatch(pet, /Close companion|pet-icon/);
	assert.match(pet, /\(value \? launcher : actor\)\?\.focus/);
});

test("every visit starts expanded without stale session greeting or folding preferences", () => {
	assert.match(pet, /welcomePending = true/);
	assert.match(pet, /speak\(0\)/);
	assert.doesNotMatch(pet, /sessionStorage|welcomeKey|compact = window\.matchMedia/);
	assert.match(pet, /inert=\{blocked\}/);
	assert.match(pet, /prefers-reduced-motion:reduce/);
});

function mountPet() {
	const script = pet.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm, "");
	const timers = new Map(), events = new Map(), images = [];
	let mount, cleanup, timerId = 0;
	const context = {
		$state: value => value, $derived: value => value, tick: async () => {},
		onMount: fn => { mount = fn; }, updatePetFacing, layoutPet, keepPetAtEdge,
		window: { innerWidth: 390, innerHeight: 844,
			addEventListener: (name, fn) => events.set(name, fn),
			removeEventListener: name => events.delete(name) },
		document: { hidden: false, documentElement: { lang: "en", classList: { contains: () => false } },
			addEventListener: (name, fn) => events.set(name, fn),
			removeEventListener: name => events.delete(name) },
		MutationObserver: class { observe() {} disconnect() {} },
		Image: class { constructor() { images.push(this); } },
		setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
		clearTimeout: id => timers.delete(id),
	};
	runInNewContext(ts.transpile(script + `
		globalThis.petTest = { fold, startDrag, moveDrag, endDrag,
			state: () => ({ compact, line, welcomePending, hopping, x, y, running, dragging }) };
	`, { target: ts.ScriptTarget.ES2022 }), context);
	cleanup = mount();
	return { ...context.petTest, context, events, images, cleanup,
		flush(delay) { for (const [id, task] of [...timers]) if (task.delay === delay) { timers.delete(id); task.fn(); } } };
}

test("mobile welcomes expanded on each fresh visit, after artwork loads", async () => {
	for (let visit = 0; visit < 2; visit++) {
		const api = mountPet();
		assert.equal(api.state().compact, false);
		api.flush(650);
		assert.equal(api.state().line, -1, "wait for the character artwork");
		api.images[0].onload(); api.flush(650);
		assert.equal(api.state().line, 0);
		assert.equal(api.state().hopping, true);
		await api.fold(true);
		assert.equal(api.state().compact, true);
		api.cleanup();
	}
});

test("internal navigation retains manual folding; cached return welcomes expanded again", async () => {
	const api = mountPet();
	api.images[0].onload(); api.flush(650);
	await api.fold(true);
	api.events.get("swup:page:view")(); api.flush(650);
	assert.equal(api.state().compact, true);
	assert.equal(api.state().line, -1);
	api.events.get("pageshow")({ persisted: true }); api.flush(650);
	assert.equal(api.state().compact, false);
	assert.equal(api.state().line, 0);
	api.flush(5500);
	api.events.get("visibilitychange")(); api.flush(650);
	assert.equal(api.state().line, -1, "switching tabs does not repeat the greeting");
	api.cleanup();
	assert.equal(api.events.has("pageshow"), false);
});

test("hidden arrival delays greeting, and manual folding cancels a pending welcome", async () => {
	const api = mountPet();
	api.context.document.hidden = true;
	api.images[0].onload(); api.flush(650);
	assert.equal(api.state().line, -1);
	api.context.document.hidden = false;
	api.events.get("visibilitychange")(); api.flush(650);
	assert.equal(api.state().line, 0);
	api.events.get("pageshow")({ persisted: true });
	await api.fold(true); api.flush(650);
	assert.equal(api.state().compact, true);
	assert.equal(api.state().line, -1);
	api.cleanup();
});

test("folding after dragging docks the star at the default lower-left position", async () => {
	for (const [width, height, left, top] of [[390, 844, 0, 0], [844, 390, 0, 0], [1440, 900, 0, 0], [320, 568, 12, 30]]) {
		const api = mountPet();
		api.context.window.visualViewport = { width, height, offsetLeft: left, offsetTop: top, removeEventListener() {} };
		api.events.get("resize")();
		const pointer = (clientX, clientY) => ({ button: 0, isPrimary: true, pointerId: 1,
			clientX, clientY, currentTarget: { setPointerCapture() {} } });
		api.startDrag(pointer(60, height - 60));
		api.moveDrag(pointer(width - 20, 80));
		assert.equal(api.state().dragging, true);
		await api.fold(true);
		const state = api.state();
		assert.equal(state.compact, true);
		assert.equal(state.x, left + 16);
		assert.equal(state.y, top + height - PET_EDGE_GAP - petBounds("star").bottom);
		assert.equal(state.running, false);
		assert.equal(state.dragging, false);
		await api.fold(true);
		assert.equal(api.state().x, state.x, "repeated folding does not drift");
		assert.equal(api.state().y, state.y);
		await api.fold(false);
		assert.equal(api.state().compact, false);
		assert(api.state().x + petBounds("idle").left < left + 50, "restores beside the dock, not the old dragged location");
		api.cleanup();
	}
});

test("minimize is an unboxed icon with a touch-sized target", () => {
	assert.doesNotMatch(pet, /pet-toolbar/);
	assert.match(pet, /class="pet-fold"[^\n]*type="button" aria-label=/);
	assert.match(pet, /\.pet-fold \{[^}]*width:44px; height:44px;[^}]*background:transparent/);
	assert.match(pet, /\.pet-fold:focus-visible svg/);
});

test("run direction turns immediately during the same drag, independent of its origin", () => {
	const right = updatePetFacing("left", 100, 160);
	assert.deepEqual(right, { facing: "right", anchorX: 160 });
	assert.deepEqual(updatePetFacing(right.facing, right.anchorX, 155), { facing: "left", anchorX: 155 });
});

test("vertical motion and subpixel jitter do not flip the run cycle", () => {
	assert.deepEqual(updatePetFacing("left", 100, 100), { facing: "left", anchorX: 100 });
	assert.deepEqual(updatePetFacing("left", 100, 101.5), { facing: "left", anchorX: 100 });
	assert.deepEqual(updatePetFacing("left", 100, 102.1), { facing: "right", anchorX: 102.1 });
});

test("run feedback stops on release and interruptions without breaking reduced motion", () => {
	assert.match(pet, /function endDrag\(\) \{ origin = null; dragging = false; stopRun\(\); \}/);
	assert.match(pet, /setTimeout\(stopRun, 140\)/);
	assert.match(pet, /onpointerup=\{endDrag\}/);
	assert.match(pet, /onlostpointercapture=\{endDrag\}/);
	assert.match(pet, /if \(resting \|\| blocked\) endDrag\(\)/);
	assert.doesNotMatch(pet, /\.dragging \.pet-sprite[^}]*animation-play-state:paused/);
	assert.match(pet, /prefers-reduced-motion:reduce[^\n]*\.pet-actor \.pet-sprite.running \{ animation:none/);
});

test("actual drag handlers keep running while held still and stop only on release", () => {
	const script = pet.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm, "");
	const timers = new Map();
	let timerId = 0;
	const context = {
		$state: value => value, $derived: value => value, onMount: () => {},
		updatePetFacing, layoutPet, keepPetAtEdge, window: { innerWidth: 1200, innerHeight: 900 },
		setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
		clearTimeout: id => timers.delete(id),
	};
	runInNewContext(ts.transpile(script + `
		globalThis.petTest = { startDrag, moveDrag, endDrag, keyMove,
			state: () => ({ running, dragging, facing, x, y }) };
	`, { target: ts.ScriptTarget.ES2022 }), context);
	const api = context.petTest;
	const pointer = clientX => ({ button: 0, isPrimary: true, pointerId: 1, clientX, clientY: 200, currentTarget: { setPointerCapture() {} } });
	api.keyMove({ key: "ArrowRight", preventDefault() {} });
	assert.equal(timers.size, 1, "keyboard pulse has a stop timer");
	api.startDrag(pointer(100));
	api.moveDrag(pointer(150));
	assert.equal(api.state().running, true);
	assert.equal(timers.size, 0, "drag cancels any previous keyboard stop timer");
	// Simulate all scheduled timeouts completing, without any new pointer movement.
	for (const fn of timers.values()) fn();
	assert.equal(api.state().running, true, "stationary hold must remain running");
	api.keyMove({ key: "ArrowRight", preventDefault() {} });
	assert.equal(timers.size, 0, "keyboard interaction cannot arm a stop while held");
	api.moveDrag(pointer(130));
	assert.equal(api.state().facing, "left");
	assert.equal(api.state().running, true);
	api.endDrag();
	assert.equal(api.state().running, false);
	assert.equal(api.state().dragging, false);
});

test("visible artwork reaches all four mobile edges without the speech-box air wall", () => {
	for (const [width, height] of [[320, 568], [390, 844], [430, 740], [844, 390]]) {
		const viewport = { left: 0, top: 0, width, height };
		for (const pose of ["idle", "right", "left", "star"]) {
			const b = petBounds(pose);
			const start = layoutPet({ x: -9999, y: -9999 }, pose, viewport);
			const end = layoutPet({ x: 9999, y: 9999 }, pose, viewport);
			assert.equal(start.x + b.left, PET_EDGE_GAP);
			assert.equal(start.y + b.top, PET_EDGE_GAP);
			assert.equal(end.x + b.right, width - PET_EDGE_GAP);
			assert.equal(end.y + b.bottom, height - PET_EDGE_GAP);
			for (const p of [start, end]) {
				assert(p.speechX >= PET_EDGE_GAP && p.speechX + p.speechWidth <= width - PET_EDGE_GAP);
				assert(p.speechY >= PET_EDGE_GAP && p.speechY + 64 <= height - PET_EDGE_GAP);
				assert(p.foldX >= PET_EDGE_GAP && p.foldX + 44 <= width - PET_EDGE_GAP);
				assert(p.foldY >= PET_EDGE_GAP && p.foldY + 44 <= height - PET_EDGE_GAP);
			}
		}
	}
});

test("release at an edge preserves visible alignment when returning to the narrower idle pose", () => {
	const viewport = { left: 12, top: 30, width: 390, height: 600 };
	for (const pose of ["left", "right"]) {
		for (const value of [-9999, 9999]) {
			const run = layoutPet({ x: value, y: value }, pose, viewport);
			const idle = layoutPet(keepPetAtEdge(run, pose, "idle", viewport), "idle", viewport);
			const runBounds = petBounds(pose), idleBounds = petBounds("idle");
			assert.equal(run.x + (value < 0 ? runBounds.left : runBounds.right), idle.x + (value < 0 ? idleBounds.left : idleBounds.right));
			assert.equal(run.y + (value < 0 ? runBounds.top : runBounds.bottom), idle.y + (value < 0 ? idleBounds.top : idleBounds.bottom));
		}
	}
});

test("mobile viewport resizing and panning re-constrain the pet", () => {
	assert.match(pet, /window\.visualViewport\?\.addEventListener\("resize", constrain\)/);
	assert.match(pet, /window\.visualViewport\?\.addEventListener\("scroll", constrain\)/);
	assert.match(pet, /window\.visualViewport\?\.removeEventListener\("resize", constrain\)/);
	assert.doesNotMatch(pet, /Math\.max\(88|\[196, 248\]/);
});
