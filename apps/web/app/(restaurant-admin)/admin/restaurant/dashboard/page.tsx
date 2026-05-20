"use client";

import { TrendingUp, ShoppingBag, Star, Clock } from "lucide-react";
import { useMyRestaurants, useRestaurantAnalytics } from "@/lib/api/restaurants";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
    return (
        <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
        </div>
    );
}

export default function RestaurantDashboard() {
    const { data: restaurants } = useMyRestaurants();
    const myRestaurants: any[] = restaurants?.data ?? restaurants ?? [];
    const restaurantId = myRestaurants[0]?.id;
    const { data: analyticsData } = useRestaurantAnalytics(restaurantId ?? "");
    const analytics = analyticsData?.data ?? analyticsData;

    const totalRevenue = analytics?.totalRevenue ?? 0;
    const totalOrders = analytics?.totalOrders ?? 0;
    const avgRating = analytics?.averageRating ?? 0;
    const avgDelivery = analytics?.avgDeliveryMinutes ?? 30;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-zinc-500 text-sm mb-6">{myRestaurants[0]?.name ?? "Your Restaurant"}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Revenue (30d)" value={formatRupees(totalRevenue)} icon={TrendingUp} color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
                <StatCard label="Orders (30d)" value={totalOrders.toString()} icon={ShoppingBag} color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
                <StatCard label="Avg Rating" value={avgRating > 0 ? avgRating.toFixed(1) : "N/A"} icon={Star} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" />
                <StatCard label="Avg Delivery" value={`${avgDelivery}m`} icon={Clock} color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
            </div>

            {/* Popular items */}
            {analytics?.popularItems?.length > 0 && (
                <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                    <h2 className="font-bold mb-4">Top Selling Items</h2>
                    <div className="space-y-3">
                        {analytics.popularItems.slice(0, 5).map((item: any, i: number) => (
                            <div key={item.id} className="flex items-center gap-3">
                                <span className="text-zinc-400 text-sm font-bold w-5 text-center">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-zinc-500">{item.totalOrders} orders</p>
                                </div>
                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{formatRupees(item.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
