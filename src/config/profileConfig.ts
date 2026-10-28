import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar-salan.jpg", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "Salan",
	bio: "把日常寫成故事，把好奇變成作品。",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		{
			name: "GitHub",
			icon: "simple-icons:github",
			url: "https://github.com/salan-01",
		},
		{
			name: "X",
			icon: "simple-icons:x",
			url: "https://x.com/Salan8e",
		},
		{
			name: "YouTube",
			icon: "simple-icons:youtube",
			url: "https://www.youtube.com/@Salan-01",
		},
		{
			name: "Steam",
			icon: "simple-icons:steam",
			url: "https://steamcommunity.com/id/salan9x/",
		},
		{
			name: "Xiaohongshu",
			icon: "simple-icons:xiaohongshu",
			url: "https://www.xiaohongshu.com/user/profile/63555909000000001901da28",
		},
	],
};
