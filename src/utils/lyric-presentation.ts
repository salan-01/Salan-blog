/** Credit lines stay available in the player, but are not hero subtitles. */
export function isLyricCredit(text: string): boolean {
	return /^(?:作[詞词曲]|[編编][曲词詞]|[詞词曲]|演唱|歌手|原唱|[製制]作(?:人)?|[監监]製|混音|母[帶带]|錄音|录音|和[聲声]|[發发]行|出品|版[權权]|OP|SP|Lyrics?(?:\s+by)?|Compos(?:er|ed)(?:\s+by)?|Arrang(?:er|ed)(?:\s+by)?|Written\s+by|Produced\s+by)\s*[:：/／]/i.test(text.trim());
}

export interface LyricLine { time: number; text: string }

export function parseLrc(source: string): LyricLine[] {
	const lines: LyricLine[] = [];
	const offset = Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1] ?? 0) / 1000;
	for (const raw of source.split(/\r?\n/)) {
		const text = raw.replace(/\[[^\]]+\]/g, "").trim();
		for (const match of raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)) {
			lines.push({ time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] ?? 0}`) - offset, text });
		}
	}
	return lines.sort((a, b) => a.time - b.time);
}

export function currentLyric(lines: LyricLine[], time: number, offset = 0): string {
	for (let i = lines.length - 1; i >= 0; i--) {
		if (time + offset >= lines[i].time) return lines[i].text;
	}
	return "";
}

export function isPetLyric(text: string, title = "", artist = ""): boolean {
	const normalized = text.trim();
	if (!normalized || isLyricCredit(normalized) || /(?:LRC歌[詞词]|下[載载]歌[詞词]|[純纯]音[樂乐]|^\s*[♪♫]+\s*$)/i.test(normalized)) return false;
	const key = (value: string) => value.replace(/[\s\-–—·/／:：]+/g, "").toLowerCase();
	const credits = [title, artist, title + artist, artist + title].filter(Boolean).map(key);
	return !credits.includes(key(normalized));
}

export function showPetLyrics(visible: boolean, playing: boolean, loading: boolean): boolean {
	return visible && playing && !loading;
}
