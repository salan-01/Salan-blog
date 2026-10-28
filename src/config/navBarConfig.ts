import type { NavBarConfig } from "../types/config";
import { LinkPreset } from "../types/config";

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.Friends,
		{
			name: "My Space",
			url: "#",
			icon: "material-symbols:person",
			children: [
				LinkPreset.About,
				{
					name: "番劇",
					url: "/anime/",
					icon: "material-symbols:movie",
				},
				{
					name: "日記",
					url: "/diary/",
					icon: "material-symbols:book",
				},
				{
					name: "相簿",
					url: "/albums/",
					icon: "material-symbols:photo-library",
				},
				{
					name: "我的裝置",
					url: "/devices/",
					icon: "material-symbols:devices",
				},
			],
		},
	],
};
