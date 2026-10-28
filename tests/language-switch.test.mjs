import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { getAnimeTranslationPairs, localizeAnime, toTraditional } from "../src/utils/anime-localization.mjs";

const source = readFileSync(new URL("../src/components/control/LanguageSwitch.astro", import.meta.url), "utf8");
const customPairs = source.match(/translationPairs\.push\([\s\S]*?\n\);/)[0];
const runtime = source.split('<script is:inline define:vars={{ translationPairs }}>')[1].split("\t// 讓會自行更新文字")[0];
const context = vm.createContext({
	translationPairs: [["字", "words"], ["標籤", "Tags"], ["分類", "Categories"], ...getAnimeTranslationPairs()],
	localStorage: { getItem: () => "en" },
});
vm.runInContext(customPairs + runtime, context);
const translate = (value, language = "en") => context.translateValue(value, language);

test("translates decorated and joined tags, preserving spacing and round trips", () => {
	for (const [zh, en] of [["\n# 生活 ", "\n# Life "], ["#生活 #技術 #隨筆", "#Life #Technology #Notes"], ["# 生活 # 技術", "# Life # Technology"]]) {
		assert.equal(translate(zh), en);
		assert.equal(translate(en, "zh_TW"), zh);
		assert.equal(translate(en), en);
	}
});

test("translates compound metadata, page titles and accessible taxonomy labels", () => {
	assert.equal(translate(" 340  字 "), " 340  words ");
	assert.equal(translate("1 字"), "1 word");
	assert.equal(translate("12 分鐘"), "12 minutes");
	assert.equal(translate("340 words", "zh_TW"), "340 字");
	assert.equal(translate("2026年\n9月"), "2026 / 9");
	assert.equal(translate("2026 / 9", "zh_TW"), "2026年 9月");
	assert.equal(translate("View all posts in the 小屋日誌 category"), "View all posts in the Cottage Journal category");
	assert.equal(translate("View all posts tagged with 生活"), "View all posts tagged with Life");
	assert.equal(translate("Salanの喫茶店 - 記錄生活、技術與一路上的靈感"), "Salan's Café - Notes on life, technology, and inspiration along the way");
	assert.equal(translate("Salan's Café", "zh_TW"), "Salanの喫茶店");
	assert.equal(translate("文章列表"), "Post List");
});

test("leaves unknown content, identifiers and URLs intact", () => {
	for (const value of ["# 未翻譯的標籤", "/archive/?tag=生活", "生活中的新故事", "const 生活 = 1;"]) assert.equal(translate(value), value);
});

test("observes hydrated text and labels, with guarded writes to avoid observer loops", () => {
	assert.match(source, /characterData: true/);
	assert.match(source, /attributeFilter: \["aria-label", "title", "placeholder", "alt"\]/);
	assert.match(source, /if \(textNode.nodeValue !== translated\)/);
	assert.match(source, /if \(root.nodeValue !== translated\)/);
	assert.match(source, /if \(original !== translated\)/);
});

test("all synced anime including lazy cards have English and Traditional content", () => {
	const items = JSON.parse(readFileSync(new URL("../src/data/bilibili-data.json", import.meta.url), "utf8"));
	assert.ok(items.length > 24, "exercise entries beyond the initial lazy-load batch");
	for (const item of items) {
		const english = localizeAnime(item);
		for (const field of ["title", "description", "studio"]) {
			assert.doesNotMatch(english[field], /\p{Script=Han}/u, `${item.title}: ${field}`);
			assert.equal(translate(english[field], "zh_TW"), toTraditional(item[field]).trim());
			assert.doesNotMatch(translate(translate(english[field], "zh_TW")), /\p{Script=Han}/u);
		}
		for (let i = 0; i < item.genre.length; i++) {
			assert.equal(translate(english.genre[i], "zh_TW"), toTraditional(item.genre[i]));
		}
	}
});

test("new untranslated anime cannot silently leak into English builds", () => {
	assert.throws(() => localizeAnime({ title: "未翻译的新番" }), /Missing English translation/);
});
