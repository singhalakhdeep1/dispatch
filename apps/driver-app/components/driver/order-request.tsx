"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent } from "@orderhub/ui";
import { respondToOrder } from "@/lib/api/driver";
import { formatMoney } from "@orderhub/shared";

interface Props {
    order: {
        orderId: string;
        restaurantName: string;
        restaurantAddress: string;
        deliveryAddress: string;
        distanceKm: number;
        estimatedEarnings: number;
    };
    onHandled: () => void;
}

const TIMEOUT_SECS = 30;

export function OrderRequestCard({ order, onHandled }: Props) {
    const [countdown, setCountdown] = useState(TIMEOUT_SECS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const t = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) { clearInterval(t); onHandled(); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    async function respond(accept: boolean) {
        setLoading(true);
        await respondToOrder(order.orderId, accept).catch(console.error);
        onHandled();
    }

    return (
        <Card className="border-2 border-orange-400 shadow-md">
            <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">New Order!</h3>
                    <span className="text-orange-500 font-mono font-bold">{countdown}s</span>
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                    <p><span className="font-medium">From:</span> {order.restaurantName}</p>
                    <p><span className="font-medium">To:</span> {order.deliveryAddress}</p>
                    <p><span className="font-medium">Distance:</span> {order.distanceKm.toFixed(1)} km</p>
                    <p><span className="font-medium">Earnings:</span> {formatMoney(order.estimatedEarnings)}</p>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => respond(false)}
                        disabled={loading}
                    >
                        Reject
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => respond(true)}
                        isLoading={loading}
                    >
                        Accept
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
