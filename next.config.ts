import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	cacheComponents: true,
	experimental: {
		authInterrupts: true,
		serverActions: {
			bodySizeLimit: "3mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "ik.imagekit.io",
				pathname: `/**`,
			},
		],
	},
};

export default nextConfig;
