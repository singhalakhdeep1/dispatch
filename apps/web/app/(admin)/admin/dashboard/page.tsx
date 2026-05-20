"use client";

import { Store, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
    return (
        <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
        </div>
    );
}

export default function AdminDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const res = await apiClient.get("/v1/admin/stats");
            return res.data?.data ?? res.data;
        },
    });

    const stats = data ?? {};

    return (
        <div>
            <h1 className="text-2xl font-bold mb-1">Platform Overview</h1>
            <p className="text-zinc-500 text-sm mb-6">All-time statistics</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Restaurants" value={isLoading ? "..." : (stats.totalRestaurants ?? 0).toString()} icon={Store} color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
                <StatCard label="Total Users" value={isLoading ? "..." : (stats.totalUsers ?? 0).toString()} icon={Users} color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
                <StatCard label="Total Orders" value={isLoading ? "..." : (stats.totalOrders ?? 0).toString()} icon={ShoppingBag} color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
                <StatCard label="Platform Revenue" value={isLoading ? "..." : formatRupees(stats.totalRevenue ?? 0)} icon={TrendingUp} color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
            </div>

            {/* Recent orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RecentOrdersWidget />
                <PendingRestaurantsWidget />
            </div>
        </div>
    );
}

function RecentOrdersWidget() {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-recent-orders"],
        queryFn: async () => {
            const res = await apiClient.get("/v1/orders?pageSize=5&page=1");
            return res.data?.data?.orders ?? res.data?.orders ?? [];
        },
    });
    const orders: any[] = data ?? [];

    return (
        <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="font-bold mb-4">Recent Orders</h2>
            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
                <p className="text-sm text-zinc-400">No orders yet</p>
            ) : (
                <div className="space-y-2">
                    {orders.map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between text-sm">
                            <div>
                                <span className="font-medium">#{o.id.slice(-6).toUpperCase()}</span>
                                <span className="text-zinc-400 ml-2">{o.restaurant?.name}</span>
                            </div>
                            <span className="font-semibold">₹{((o.totalAmount ?? 0) / 100).toFixed(0)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PendingRestaurantsWidget() {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-pending-restaurants"],
        queryFn: async () => {
            const res = await apiClient.get("/v1/restaurants?status=PENDING_APPROVAL&pageSize=5");
            return res.data?.data ?? [];
        },
    });
    const restaurants: any[] = data ?? [];

    return (
        <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <h2 className="font-bold mb-4">Pending Restaurant Approvals</h2>
            {isLoading ? (
                <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />)}</div>
            ) : restaurants.length === 0 ? (
                <p className="text-sm text-zinc-400">No pending approvals</p>
            ) : (
                <div className="space-y-2">
                    {restaurants.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{r.name}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
