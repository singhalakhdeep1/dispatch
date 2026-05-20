"use client";

import { useState } from "react";
import { Clock, CheckCircle2, XCircle, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useMyRestaurants } from "@/lib/api/restaurants";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

const STATUS_COLORS: Record<string, string> = {
    PLACED: "bg-yellow-100 text-yellow-700",
    FINDING_DRIVER: "bg-blue-100 text-blue-700",
    DRIVER_ASSIGNED: "bg-blue-100 text-blue-700",
    PICKED_UP: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
};

export default function RestaurantOrdersPage() {
    const { data: restaurants } = useMyRestaurants();
    const restaurantId = (restaurants?.data ?? restaurants ?? [])[0]?.id;
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["restaurant-orders", restaurantId],
        queryFn: async () => {
            const res = await apiClient.get(`/v1/orders?restaurantId=${restaurantId}&pageSize=50`);
            return res.data?.data ?? res.data;
        },
        enabled: !!restaurantId,
        refetchInterval: 15_000,
    });

    const orders: any[] = Array.isArray(data) ? data : data?.orders ?? [];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-5">Incoming Orders</h1>

            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order: any) => (
                        <div key={order.id} className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <span className="font-bold text-sm">#{order.id.slice(-6).toUpperCase()}</span>
                                    <span className="text-xs text-zinc-400 ml-2">{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <Badge className={`text-[10px] ${STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-600"}`} variant="secondary">
                                    {order.status.replace("_", " ")}
                                </Badge>
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                {order.items?.map((i: any) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`).join(", ")}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold">{formatRupees(order.totalAmount)}</span>
                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                    <Bike className="h-3.5 w-3.5" />
                                    {order.driver ? order.driver.name : "Finding driver..."}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
