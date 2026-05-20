"use client";

import { useState } from "react";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

const STATUS_COLOR: Record<string, string> = {
    PLACED: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-cyan-100 text-cyan-700",
    PREPARING: "bg-yellow-100 text-yellow-700",
    READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
    FINDING_DRIVER: "bg-orange-100 text-orange-700",
    DRIVER_ASSIGNED: "bg-indigo-100 text-indigo-700",
    PICKED_UP: "bg-violet-100 text-violet-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
};

const STATUSES = ["ALL", "PLACED", "CONFIRMED", "PREPARING", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
    const [status, setStatus] = useState("ALL");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", status],
        queryFn: async () => {
            const params: any = { pageSize: 50 };
            if (status !== "ALL") params.status = status;
            const res = await apiClient.get("/v1/orders", { params });
            return res.data?.data?.orders ?? res.data?.orders ?? [];
        },
    });

    const orders: any[] = Array.isArray(data) ? data : [];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-5">All Orders</h1>

            {/* Status filter tabs */}
            <div className="flex gap-2 flex-wrap mb-4">
                {STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${status === s ? "bg-orange-500 text-white border-orange-500" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-orange-300"}`}
                    >
                        {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    {orders.map((o: any, i: number) => (
                        <Link
                            href={`/order/${o.id}`}
                            key={o.id}
                            className={`flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${i !== orders.length - 1 ? "border-b dark:border-zinc-800" : ""}`}
                        >
                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <ShoppingBag className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">#{o.id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-zinc-500">{o.restaurant?.name} · {o.user?.fullName ?? o.userId?.slice(0, 8)}</p>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[o.status] ?? "bg-zinc-100"}`}>
                                {o.status?.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm font-semibold">{formatRupees(o.totalAmount ?? 0)}</span>
                            <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                        </Link>
                    ))}
                    {orders.length === 0 && <p className="py-10 text-center text-zinc-400 text-sm">No orders found</p>}
                </div>
            )}
        </div>
    );
}
