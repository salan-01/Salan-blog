import type { Song } from "./types";
import shaNvCover from "../../../assets/music/cover/sha-nv.webp?url";
import shaNvLyrics from "../../../assets/music/lyrics/sha-nv.txt?raw";

export const STORAGE_KEY_VOLUME = "music-player-volume";

export const DEFAULT_VOLUME = 0.7;

export const DEFAULT_COVER_URL = "/favicon/favicon.ico";

export const LOCAL_PLAYLIST: Song[] = [
	{
		id: 1,
		title: "傻女",
		artist: "陳慧嫻",
		cover: shaNvCover,
		url: "assets/music/url/sha-nv.mp3",
		lyrics: "assets/music/lyrics/sha-nv.lrc?v=2",
		lyricsText: shaNvLyrics,
		// Positive offsets advance lyrics to match this recording's vocal entrance.
		lyricOffset: 3,
		duration: 231,
	},
];

export const DEFAULT_SONG: Song = {
	title: "Sample Song",
	artist: "Sample Artist",
	cover: DEFAULT_COVER_URL,
	url: "",
	duration: 0,
	id: 0,
};

export const DEFAULT_METING_API =
	"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
export const DEFAULT_METING_ID = "14164869977";
export const DEFAULT_METING_SERVER = "netease";
export const DEFAULT_METING_TYPE = "playlist";

export const ERROR_DISPLAY_DURATION = 3000;
export const SKIP_ERROR_DELAY = 1000;
