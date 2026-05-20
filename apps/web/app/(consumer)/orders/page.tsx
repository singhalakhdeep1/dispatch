"use client";

import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/lib/api/orders";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

const STATUS_COLOR: Record<string, string> = {
    PLACED: "bg-zinc-100 text-zinc-600",
    FINDING_DRIVER: "bg-blue-100 text-blue-700",
    DRIVER_ASSIGNED: "bg-blue-100 text-blue-700",
    PICKED_UP: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
    PLACED: "Order Placed",
    FINDING_DRIVER: "Finding Driver",
    DRIVER_ASSIGNED: "Driver Assigned",
    PICKED_UP: "On the Way",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

export default function OrdersPage() {
    const { data, isLoading } = useOrders();
    const orders = data?.data ?? data ?? [];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Orders</h1>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">No orders yet</p>
                    <Link href="/dashboard" className="mt-3 text-sm text-orange-500 hover:underline">Browse restaurants →</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order: any) => {
                        const itemCount = order.items?.length ?? 0;
                        const total = order.totalAmount ?? 0;
                        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
                        return (
                            <Link key={order.id} href={`/order/${order.id}`}>
                                <div className="flex items-center gap-4 rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-sm transition-shadow cursor-pointer">
                                    <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                                        <ShoppingBag className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{order.restaurant?.name ?? "Order"}</p>
                                        <p className="text-sm text-zinc-500">
                                            {itemCount} item{itemCount !== 1 ? "s" : ""} · {formatRupees(total)}
                                            {date ? ` · ${date}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                                            {STATUS_LABEL[order.status] ?? order.status}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
