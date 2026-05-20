"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Button, Badge, Card, CardContent } from "@orderhub/ui";
import { StatusToggle } from "@/components/driver/status-toggle";
import { OrderRequestCard } from "@/components/driver/order-request";
import { useDriverLocation } from "@/lib/location";
import { useDriverSocket } from "@/lib/socket/driver";
import { updateStatus } from "@/lib/api/driver";

export default function DriverDashboardPage() {
    const [isOnline, setIsOnline] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<any>(null);

    useDriverLocation(isOnline);
    useDriverSocket({ onOrderRequest: setPendingOrder });

    async function handleToggle() {
        const next = !isOnline;
        setIsOnline(next);
        await updateStatus(next ? "ONLINE" : "OFFLINE").catch(console.error);
    }

    return (
        <div className="space-y-6">
            <StatusToggle isOnline={isOnline} onToggle={handleToggle} />

            {pendingOrder && (
                <OrderRequestCard
                    order={pendingOrder}
                    onHandled={() => setPendingOrder(null)}
                />
            )}

            {!pendingOrder && isOnline && (
                <Card>
                    <CardContent className="py-8 text-center text-gray-400">
                        Waiting for order requests…
                    </CardContent>
                </Card>
            )}

            <div className="pt-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
