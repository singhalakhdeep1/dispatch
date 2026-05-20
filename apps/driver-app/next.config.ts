import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@orderhub/ui", "@orderhub/shared"],
    output: "standalone",
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**" },
        ],
    },
};

export default nextConfig;
