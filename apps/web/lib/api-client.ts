import axios from "axios";
import { getSession } from "next-auth/react";

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3001/api",
    timeout: 10_000,
});

apiClient.interceptors.request.use(async (config) => {
    // Only attach token in browser context
    if (typeof window !== "undefined") {
        const session = await getSession();
        if ((session as any)?.accessToken) {
            config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
        }
    }
    return config;
});
