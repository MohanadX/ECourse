import type { NextConfig } from "next";
import { env } from "./data/env/server";

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
				pathname: `/${env.IMAGEKIT_ID}/**`,
			},
		],
	},
};

export default nextConfig;
