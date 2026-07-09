import type { NextConfig } from "next";
import { env } from "./data/env/client";

const nextConfig: NextConfig = {
	/* config options here */
	cacheComponents: true,
	reactCompiler: true,
	reactStrictMode: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		authInterrupts: true,
		serverActions: {
			bodySizeLimit: "3mb",
		},
		serverComponentsHmrCache: true,
		turbopackFileSystemCacheForDev: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "ik.imagekit.io",
				pathname: `/${env.NEXT_PUBLIC_IMAGEKIT_ID}/**`,
			},
		],
	},
};

export default nextConfig;
