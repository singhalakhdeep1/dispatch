"use client";

import { useMyRestaurants, useRestaurantAnalytics } from "@/lib/api/restaurants";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

export default function AnalyticsPage() {
    const { data: restaurants } = useMyRestaurants();
    const restaurantId = (restaurants?.data ?? restaurants ?? [])[0]?.id;
    const { data: analyticsData, isLoading } = useRestaurantAnalytics(restaurantId ?? "", 30);
    const analytics = analyticsData?.data ?? analyticsData;

    const ratingBreakdown: Record<number, number> = analytics?.ratingBreakdown ?? {};

    return (
        <div>
            <h1 className="text-2xl font-bold mb-5">Analytics</h1>

            {isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-zinc-100 animate-pulse" />)}</div>
            ) : (
                <div className="space-y-5">
                    {/* Revenue and order stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: "Total Revenue (30d)", value: formatRupees(analytics?.totalRevenue ?? 0) },
                            { label: "Total Orders (30d)", value: (analytics?.totalOrders ?? 0).toString() },
                            { label: "Average Order Value", value: analytics?.totalOrders > 0 ? formatRupees(Math.round((analytics.totalRevenue ?? 0) / analytics.totalOrders)) : "N/A" },
                        ].map((s) => (
                            <div key={s.label} className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Rating breakdown */}
                    <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                        <h2 className="font-bold mb-4">Rating Breakdown</h2>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingBreakdown[star] ?? 0;
                            const total = Object.values(ratingBreakdown).reduce((a: any, b: any) => a + b, 0);
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                                <div key={star} className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-medium w-6 text-right">{star}★</span>
                                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Popular items */}
                    {analytics?.popularItems?.length > 0 && (
                        <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                            <h2 className="font-bold mb-4">Popular Items</h2>
                            <div className="space-y-3">
                                {analytics.popularItems.map((item: any, i: number) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <span className="text-zinc-400 font-bold text-sm w-5 text-center">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-zinc-500">{item.totalOrders} orders</p>
                                        </div>
                                        <span className="text-sm font-bold">{formatRupees(item.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
