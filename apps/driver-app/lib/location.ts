import { useEffect, useRef } from "react";
import { updateLocation } from "@/lib/api/driver";

const INTERVAL_MS = 5_000;

export function useDriverLocation(enabled: boolean) {
    const watchRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPos = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!enabled) {
            if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        watchRef.current = navigator.geolocation.watchPosition(
            (p) => { lastPos.current = { lat: p.coords.latitude, lng: p.coords.longitude }; },
            console.error,
            { enableHighAccuracy: true },
        );

        intervalRef.current = setInterval(() => {
            if (lastPos.current) {
                updateLocation(lastPos.current.lat, lastPos.current.lng).catch(console.error);
            }
        }, INTERVAL_MS);

        return () => {
            if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled]);
}
