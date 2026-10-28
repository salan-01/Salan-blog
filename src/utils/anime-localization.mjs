import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Converter } from "opencc-js";
import { findAnimeEnglish, animeLabels } from "../data/anime-english.mjs";

export const toTraditional = Converter({ from: "cn", to: "tw" });

// Fail visibly during a build when new entries need editorial translation,
// rather than silently publishing Simplified Chinese in the English view.
export function localizeAnime(item) {
  const english = findAnimeEnglish(item.title || "");
  if (!english) throw new Error(`[Anime i18n] Missing English translation: ${item.title}`);
  const label = (value) => {
    if (!value) return "";
    if (!animeLabels[value]) throw new Error(`[Anime i18n] Missing label: ${value}`);
    return animeLabels[value];
  };
  return { ...item, title: english.title, description: english.description,
    studio: label(item.studio), genre: (item.genre || []).map(label) };
}

/** @returns {[string, string][]} */
export function getAnimeTranslationPairs() {
  const file = path.join(process.cwd(), "src/data/bilibili-data.json");
  // No generated data on a fresh checkout until the sync runs.
  if (!existsSync(file)) return [];
  const items = JSON.parse(readFileSync(file, "utf8"));
  /** @type {[string, string][]} */
  const pairs = [];
  for (const item of items) {
    const en = localizeAnime(item);
    pairs.push([toTraditional(item.title).trim(), en.title]);
    if (item.description) pairs.push([toTraditional(item.description).trim(), en.description]);
  }
  for (const [cn, en] of Object.entries(animeLabels)) pairs.push([toTraditional(cn), en]);
  return pairs;
}
