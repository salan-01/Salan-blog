<div align="center">

<img src="public/assets/home/salan-chibi-face-v1.webp" width="96" alt="喫茶店的橙髮女孩" />

# Salanの喫茶店

**把日常寫成故事，把好奇變成作品。**

這是一間藏在網路角落的小小喫茶店。<br />
這裡收藏生活片段、技術筆記，還有讓人忍不住想分享的喜歡。

[☕ 走進喫茶店](https://salan9x.top) · [文章歸檔](https://salan9x.top/archive/) · [友站](https://salan9x.top/friends/)

</div>

<a href="https://salan9x.top">
  <img src="docs/cafe-preview.jpg" alt="Salanの喫茶店首頁：奶油桃粉色的咖啡館與橙髮女孩" />
</a>

## 店裡有什麼

- **首頁與文章**：奶油白和蜜桃粉的咖啡館場景，配合滾動動效；下方是文章列表、分類和標籤。
- **喫茶店桌寵**：進站時打招呼，可以拖動或點擊聊天；收回後會變成左下角的小星星。
- **音樂與歌詞**：播放器支援本地歌曲；播放時桌寵對話框會顯示同步歌詞，聊天時優先顯示對話。
- **追番與個人頁面**：追番資料從 Bilibili 同步，另有日記、相簿、裝置、關於與友站頁面。
- **閱讀與外觀**：繁體中文／英文切換、文章搜尋、明暗模式與主題顏色調整，支援手機和桌面。

## 使用的技術

網站以 [Astro](https://astro.build/) 產生靜態頁面，互動元件使用 Svelte 與 TypeScript，文章使用 Markdown。搜尋索引由 Pagefind 建立，正式網站部署於 Vercel。

## 在本機開店

需要 Node.js 22.12.0 或更新版本，以及 pnpm 11。

```bash
git clone https://github.com/salan-01/Salan-blog.git
cd Salan-blog
corepack enable
pnpm install
pnpm dev
```

開啟終端機顯示的本機網址，預設為 `http://localhost:3000`。

```bash
pnpm build         # 更新追番資料並建立正式版網站至 dist/
pnpm preview       # 預覽正式版，先執行 pnpm build
pnpm check         # 檢查 Astro 專案
pnpm test          # 執行專案測試
```

`pnpm build` 會嘗試從 Bilibili 取得追番資料，因此需要網路連線。若只想在本機查看版面，可先使用 `pnpm dev`。

## 專案目錄

```text
src/
├── components/          # 導航、桌寵、播放器與其他畫面元件
├── config/              # 網站、導航、個人資料和播放器設定
├── content/posts/       # Markdown 文章
├── content/spec/        # 關於等 Markdown 頁面
├── data/                # 友站、裝置、日記等資料
├── layouts/             # 頁面佈局
├── pages/               # 網站頁面
└── styles/              # 樣式與手機版調整
public/                  # 圖片、音樂和公開靜態資源
tests/                   # 專案測試
```

## 平時怎麼修改

| 想修改的內容 | 位置 |
| --- | --- |
| 部落格文章 | [`src/content/posts/`](src/content/posts/) |
| 網站名稱與外觀 | [`src/config/siteConfig.ts`](src/config/siteConfig.ts) |
| 導航選單 | [`src/config/navBarConfig.ts`](src/config/navBarConfig.ts) |
| 個人介紹與社群連結 | [`src/config/profileConfig.ts`](src/config/profileConfig.ts) |
| 關於頁面 | [`src/content/spec/about.md`](src/content/spec/about.md) |
| 友站 | [`src/data/friends.ts`](src/data/friends.ts) |
| 裝置清單 | [`src/data/devices.ts`](src/data/devices.ts) |
| 日記內容 | [`src/data/diary.ts`](src/data/diary.ts) |
| 音樂與歌詞設定 | [`src/components/widgets/music-player/constants.ts`](src/components/widgets/music-player/constants.ts) |
| 音樂播放器設定 | [`src/config/musicConfig.ts`](src/config/musicConfig.ts) |
| 桌寵 | [`src/components/widgets/CafePet.svelte`](src/components/widgets/CafePet.svelte) |

### 寫一篇文章

在 `src/content/posts/` 新增 `.md` 或 `.mdx` 檔案，或使用 `pnpm new-post -- <檔名>`。文章開頭的資料用來設定標題、日期、摘要、分類和標籤：

```yaml
---
title: 今天的咖啡館
published: 2026-10-28
description: 一則想留住的小故事。
tags: [生活, 隨筆]
category: 小屋日誌
draft: false
---
```

在第二個 `---` 後面用 Markdown 撰寫正文。將 `draft` 設為 `true` 可以先保留草稿；完成後執行 `pnpm dev` 預覽。

### 更換音樂和歌詞

目前使用本地播放清單。歌曲檔案位於 `public/assets/music/url/`，封面位於 `src/assets/music/cover/`，內嵌歌詞位於 `src/assets/music/lyrics/`。在 `constants.ts` 的 `LOCAL_PLAYLIST` 中設定歌名、歌手、檔案、封面與歌詞。

若歌曲同時設定 `lyricsText` 和 `lyrics`，播放器會優先使用 `lyricsText`，因此更新歌詞時也要更新它引用的文字檔。`lyricOffset` 以秒為單位，正數會讓歌詞提早顯示；目前〈傻女〉設定為提前 3 秒。

### 更新追番記錄

追番來源及 Bilibili 使用者 ID 位於 `src/config/siteConfig.ts` 的 `anime` 與 `bilibili` 設定中。執行 `pnpm update-bilibili` 可手動同步；正式建置也會執行更新。取得的資料存放在 `src/data/bilibili-data.json`，屬於產生的資料，沒有提交到 Git。

如果使用需要登入的資料，請把 `BILI_SESSDATA` 放在本機 `.env` 或部署平台的環境變數中，不要寫進程式碼或提交到 GitHub。其他可選設定可參考 [`.env.example`](.env.example)。

## 更新網站

這是部落格的公開原始碼快照，供瀏覽與參考；正式網站由另一個私有倉庫連接 Vercel 部署。修改此公開倉庫或其副本，並不會自動更新正式網站。要更新自己的部署，請在本機預覽、檢查後，依照自己的 Vercel Git 連線設定部署。

如需新增音樂、圖片或其他素材，請確認自己有權在網站及倉庫中使用。

## 致謝

這間喫茶店基於 [Mizuki](https://github.com/LyraVoid/Mizuki) 主題打造，感謝原作者與開源社群的作品。專案授權及相關聲明見 [LICENSE](LICENSE) 與 [LICENSE.MIT](LICENSE.MIT)。

<div align="center">

✦ 感謝來訪，願你在這裡度過一段輕鬆的時光。 ✦

</div>
