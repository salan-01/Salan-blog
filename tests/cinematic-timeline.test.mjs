import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storyFrame } from '../src/utils/cinematic-timeline.ts';

test('story clamps overscroll at both ends', () => {
	assert.deepEqual(storyFrame(-1), storyFrame(0));
	assert.deepEqual(storyFrame(2), storyFrame(1));
});
test('three scroll chapters have distinct readable holds', () => {
	assert.equal(storyFrame(0).intro, 1);
	assert.equal(storyFrame(0.45).middle, 1);
	assert.equal(storyFrame(0.95).outro, 1);
	assert.equal(storyFrame(0.45).intro, 0);
	assert.equal(storyFrame(0.95).middle, 0);
});
test('foreground camera stays bounded and mobile uses its own framing', () => {
	for (const mobile of [false, true]) {
		for (let i = 0; i <= 100; i++) {
			const s = storyFrame(i / 100, mobile);
			for (const k of ['intro', 'middle', 'outro', 'palette']) assert.ok(s[k] >= 0 && s[k] <= 1);
			assert.ok(s.scale >= (mobile ? 0.77 : 0.8) && s.scale <= (mobile ? 1.18 : 1.13));
			assert.ok(Math.abs(s.x) <= (mobile ? 16 : 43));
			assert.ok(Math.abs(s.rotation) <= 3);
			assert.deepEqual(s, storyFrame(i / 100, mobile));
		}
	}
	assert.notEqual(storyFrame(0.5, true).x, storyFrame(0.5, false).x);
});

test('mobile camera has a close-up, a wide reveal and a final push-in', () => {
	const opening = storyFrame(0, true);
	const middle = storyFrame(0.46, true);
	const ending = storyFrame(0.93, true);
	assert.ok(opening.scale - middle.scale > 0.35);
	assert.ok(ending.scale - middle.scale > 0.25);
	assert.ok(opening.x - middle.x >= 28);
	assert.equal(middle.middle, 1);
	assert.equal(ending.outro, 1);
	assert.deepEqual(storyFrame(-1, true), opening);
	assert.deepEqual(storyFrame(2, true), storyFrame(1, true));
});

test('desktop camera framing is unchanged', () => {
	for (const [p, scale, x, y] of [[0, 1.12, 22, 8], [.46, .84, -21, 4], [.93, 1.04, 18, 7]]) {
		const frame = storyFrame(p);
		assert.ok(Math.abs(frame.scale - scale) < 1e-9);
		assert.equal(frame.x, x);
		assert.equal(frame.y, y);
	}
});
