import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@orderhub/ui", "@orderhub/shared"],
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "*.supabase.co" },
        ],
    },
    experimental: {
        serverActions: { allowedOrigins: ["localhost:3000"] },
    },
};

export default nextConfig;
