import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { Converter } from 'opencc-js/cn2t';
import { parseLrc, currentLyric, isPetLyric, isLyricCredit, showPetLyrics } from '../src/utils/lyric-presentation.ts';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

test('pet and player share timestamps, fractions, song calibration and seek behavior', () => {
  const lines = parseLrc('[00:10.50][00:20:500]第一句\n[00:15]第二句');
  assert.equal(currentLyric(lines, 8.99, 1.5), '');
  assert.equal(currentLyric(lines, 9, 1.5), '第一句');
  assert.equal(currentLyric(lines, 14, 1.5), '第二句');
  assert.equal(currentLyric(lines, 19, 1.5), '第一句');
  assert.equal(currentLyric(lines, 0, 1.5), '', 'seeking back clears the old lyric');
});

test('Sha Nv uses the audited three-second advance in both lyric surfaces', async () => {
  const constants = await readFile(new URL('../src/components/widgets/music-player/constants.ts', import.meta.url), 'utf8');
  assert.match(constants, /lyricOffset:\s*3\s*,/);
  const lyrics = await readFile(new URL('../src/assets/music/lyrics/sha-nv.txt', import.meta.url), 'utf8');
  const lines = parseLrc(lyrics);
  assert.equal(currentLyric(lines, 32, 3), lines.find(line => line.time === 35).text);
  assert.equal(currentLyric(lines, 73, 3), lines.find(line => line.time === 76).text);
  assert.equal(currentLyric(lines, 139, 3), lines.find(line => line.time === 142).text);
});

test('blank timed lines clear lyrics during instrumental breaks, with LRC offsets respected', () => {
  const lines = parseLrc('[offset:500]\n[00:10]一句\n[00:12]\n[00:20]下一句');
  assert.equal(currentLyric(lines, 9.5), '一句');
  assert.equal(currentLyric(lines, 11.5), '');
  assert.equal(currentLyric(lines, 19.5), '下一句');
  assert.equal(currentLyric(parseLrc('invalid lyrics'), 50), '');
});

test('pet hides credits, metadata, title and artist without suppressing ordinary lyrics', () => {
  for (const text of ['', '作詞：某人', '作曲：某人', '傻女 - 陳慧嫻', '傻女', '陳慧嫻', '傻女的LRC歌詞，下載歌詞', '純音樂', '♪']) {
    assert.equal(isPetLyric(text, '傻女', '陳慧嫻'), false, text);
  }
  assert.equal(isPetLyric('夜裡的風', '傻女', '陳慧嫻'), true);
  assert.equal(isPetLyric('Written in the stars'), true);
});

test('lyrics stay traditional without translating the song into interface English', () => {
  const convert = Converter({ from: 'cn', to: 'tw' });
  const lines = parseLrc(convert('[00:10]夜里的风，让故事继续'));
  assert.equal(currentLyric(lines, 10), '夜裡的風，讓故事繼續');
  assert.equal(convert('Hello, my friend'), 'Hello, my friend');
});

test('pause, loading, chat, folding and dragging suppress music bubbles', () => {
  assert.equal(showPetLyrics(true, true, false), true);
  assert.equal(showPetLyrics(true, false, false), false);
  assert.equal(showPetLyrics(true, true, true), false);
  assert.equal(showPetLyrics(false, true, false), false);
});

test('integration shares the audio clock, cleans subscriptions and keeps lyrics to two lines', async () => {
  const pet = await readFile(new URL('../src/components/widgets/CafePet.svelte', import.meta.url), 'utf8');
  const music = await readFile(new URL('../src/components/widgets/PetMusicLyric.svelte', import.meta.url), 'utf8');
  const lyric = await readFile(new URL('../src/components/widgets/music-player/atoms/CurrentLyric.svelte', import.meta.url), 'utf8');
  assert.match(pet, /visible=\{!compact && line < 0 && !dragging && !blocked && !resting\}/);
  assert.match(music, /onMount\(\(\) => musicPlayerStore.subscribe/);
  assert.match(music, /currentTime=\{player.currentTime\} timeOffset=\{player.currentSong.lyricOffset\}/);
  assert.match(music, /aria-live="off" data-no-translate/);
  assert.match(music, /\{#if hasPlayed\}/);
  assert.doesNotMatch(music, /new Audio|setInterval|\.play\(/);
  assert.match(lyric, /if \(!controller.signal.aborted\) lyricLines = parseLrc\(source\)/);
  assert.match(lyric, /return \(\) => controller.abort\(\)/);
  assert.match(lyric, /-webkit-line-clamp:2/);
});

test('actual lyric loader converts traditional text and rejects stale song responses', async () => {
  const source = await readFile(new URL('../src/components/widgets/music-player/atoms/CurrentLyric.svelte', import.meta.url), 'utf8');
  const script = source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*;$/gm, '')
    .replace('import("opencc-js/cn2t")', 'loadConverter()');
  const requests = [];
  let effect;
  const context = {
    $state: v => v, $derived: v => v, $effect: fn => { effect = fn; },
    $props: () => ({ lyricsUrl: '/old.lrc', currentTime: 10, variant: 'pet' }),
    parseLrc, currentLyric, isPetLyric, isLyricCredit, AbortController,
    resolveAssetUrl: value => value, loadConverter: async () => ({ Converter }),
    fetch: () => new Promise(resolve => requests.push(resolve)),
  };
  runInNewContext(ts.transpile(script + `
    globalThis.api = { lines: () => lyricLines,
      setSource: (url, text) => { lyricsUrl = url; lyricsText = text; } };
  `, { target: ts.ScriptTarget.ES2022 }), context);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const cleanupOld = effect();
  cleanupOld();
  context.api.setSource('/new.lrc', '[00:10]风里的故事');
  const cleanupNew = effect(); await flush();
  assert.equal(currentLyric(context.api.lines(), 10), '風裡的故事');
  requests[0]({ ok: true, text: async () => '[00:10]旧歌曲' }); await flush();
  assert.equal(currentLyric(context.api.lines(), 10), '風裡的故事', 'late old song never replaces the current one');
  cleanupNew();
  context.api.setSource('/missing.lrc', undefined);
  const cleanupMissing = effect();
  assert.equal(context.api.lines().length, 0, 'changing track clears stale lyrics immediately');
  requests[1]({ ok: false, status: 404 }); await flush();
  assert.equal(context.api.lines().length, 0, 'unavailable lyrics leave no empty bubble content');
  cleanupMissing();
});
