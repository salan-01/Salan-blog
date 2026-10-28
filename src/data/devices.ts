// 设备数据配置文件

export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = Record<string, Device[]> & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	vivo: [
		{
			name: "vivo X300 Pro",
			image: "/images/device/vivo-x300-pro.png",
			specs: "16GB + 512GB",
			description:
				"專業影像旗艦，配備蔡司雲台級主攝、OriginOS 6 與 90W 超快閃充。",
			link: "https://www.vivo.com.cn/vivo/x300pro/",
		},
		{
			name: "vivo Pad Air",
			image: "/images/device/vivo-pad-air.png",
			specs: "12GB + 256GB",
			description:
				"11.5 吋 2.8K 144Hz 原色螢幕，搭載 Snapdragon 870 與 8500mAh 電池。",
			link: "https://www.vivo.com.cn/vivo/vivopadair/",
		},
		{
			name: "vivo TWS 4 Hi-Fi",
			image: "/images/device/vivo-tws-4-hifi.png",
			specs: "55dB 降噪 / 45 小時續航",
			description:
				"搭載第三代 Qualcomm S3 音訊平台，支援 LDAC、aptX Lossless 與藍牙 5.4。",
			link: "https://www.vivo.com.cn/vivo/vivotws4hifi/",
		},
	],
	Apple: [
		{
			name: "MacBook Air M4",
			image: "/images/device/macbook-air-m4-midnight.jpg",
			specs: "13 吋 / 16GB + 512GB / 午夜色",
			description:
				"搭載 Apple M4 晶片與 13.6 吋 Liquid Retina 顯示器，電池續航最長可達 18 小時。",
			link: "https://support.apple.com/zh-tw/122209",
		},
	],
};
