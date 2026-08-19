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
    hideLogsAfterAbort: true, // to hide logs emitted after a bail-out.
    serverComponentsHmrCache: true,
    turbopackFileSystemCacheForDev: true,
  },
  poweredByHeader: false, // prevent powered header on http (its value: Next.js)
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
