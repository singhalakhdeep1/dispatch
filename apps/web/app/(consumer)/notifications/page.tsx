"use client";

import { Bell, ShoppingBag, Star, Tag, Megaphone } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const ICON_MAP: Record<string, any> = {
    ORDER: ShoppingBag,
    REVIEW: Star,
    PROMO: Tag,
    SYSTEM: Megaphone,
};

export default function NotificationsPage() {
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await apiClient.get("/v1/notifications");
            return res.data?.data ?? res.data ?? [];
        },
    });

    const markRead = useMutation({
        mutationFn: (id: string) => apiClient.patch(`/v1/notifications/${id}/read`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    });

    const markAllRead = useMutation({
        mutationFn: () => apiClient.patch("/v1/notifications/read-all"),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    });

    const notifications: any[] = Array.isArray(data) ? data : [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold">Notifications {unreadCount > 0 && <span className="ml-2 text-sm bg-orange-500 text-white rounded-full px-2 py-0.5">{unreadCount}</span>}</h1>
                {unreadCount > 0 && (
                    <button onClick={() => markAllRead.mutate()} className="text-xs text-orange-500 hover:underline">Mark all read</button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                    <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                </div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden">
                    {notifications.map((n: any, i: number) => {
                        const Icon = ICON_MAP[n.type] ?? Bell;
                        return (
                            <button
                                key={n.id}
                                onClick={() => !n.isRead && markRead.mutate(n.id)}
                                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${!n.isRead ? "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/60" : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"} ${i !== notifications.length - 1 ? "border-b dark:border-zinc-800" : ""}`}
                            >
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? "bg-orange-100 dark:bg-orange-900" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                                    <Icon className={`h-4 w-4 ${!n.isRead ? "text-orange-600" : "text-zinc-500"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                                    {n.body && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>}
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                {!n.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
