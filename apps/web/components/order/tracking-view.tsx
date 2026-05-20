"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket, joinOrderRoom, leaveRoom } from "@/lib/socket/tracking";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/map/live-map").then((m) => m.LiveMap), {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-gray-200" />,
});

interface Props {
    orderId: string;
    driverId?: string | null;
}

interface DriverLocation {
    lat: number;
    lng: number;
    driverId: string;
}

export function TrackingView({ orderId, driverId }: Props) {
    const [driverLoc, setDriverLoc] = useState<DriverLocation | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const room = `order:${orderId}`;

    useEffect(() => {
        joinOrderRoom(orderId);
        const s = getSocket();

        s.on("driver:location", (data: DriverLocation) => setDriverLoc(data));
        s.on("order:update", (data: { status: string }) => {
            setStatus(data.status);
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        });

        return () => {
            leaveRoom(room);
            s.off("driver:location");
            s.off("order:update");
        };
    }, [orderId]);

    return (
        <div className="rounded-xl overflow-hidden border">
            <div className="h-64">
                <LiveMap driverLoc={driverLoc} />
            </div>
            {status && (
                <div className="bg-orange-50 px-4 py-2 text-sm text-orange-700 font-medium">
                    Status: {status.replace(/_/g, " ")}
                </div>
            )}
        </div>
    );
}
