import axios from "axios";
import { getSession } from "next-auth/react";

export const driverApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3001/api",
    timeout: 10_000,
});

driverApi.interceptors.request.use(async (config) => {
    if (typeof window !== "undefined") {
        const session = await getSession();
        if ((session as any)?.accessToken) {
            config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
        }
    }
    return config;
});

export async function updateStatus(status: "ONLINE" | "OFFLINE" | "ON_DELIVERY") {
    return driverApi.patch("/v1/drivers/status", { status });
}

export async function updateLocation(lat: number, lng: number) {
    return driverApi.patch("/v1/drivers/location", { latitude: lat, longitude: lng });
}

export async function respondToOrder(orderId: string, accept: boolean) {
    const driverId = "me"; // resolved by gateway via X-User-Id header
    return driverApi.patch(`/v1/drivers/${driverId}/orders/${orderId}/respond`, {
        accept,
    });
}
