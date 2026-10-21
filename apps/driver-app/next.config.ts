import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@orderhub/ui", "@orderhub/shared"],
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**" },
        ],
    },
};

export default nextConfig;
