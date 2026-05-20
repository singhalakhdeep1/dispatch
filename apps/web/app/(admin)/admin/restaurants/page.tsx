"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_COLOR: Record<string, string> = {
    OPEN: "bg-green-100 text-green-700",
    CLOSED: "bg-zinc-100 text-zinc-600",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-600",
};

export default function AdminRestaurantsPage() {
    const [search, setSearch] = useState("");
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-restaurants", search],
        queryFn: async () => {
            const res = await apiClient.get("/v1/restaurants", { params: { search: search || undefined, pageSize: 50 } });
            return res.data?.data ?? res.data ?? [];
        },
    });

    const restaurants: any[] = Array.isArray(data) ? data : data?.restaurants ?? [];

    const approve = useMutation({
        mutationFn: (id: string) => apiClient.patch(`/v1/restaurants/${id}/approve`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-restaurants"] }),
    });

    const suspend = useMutation({
        mutationFn: (id: string) => apiClient.patch(`/v1/restaurants/${id}/suspend`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-restaurants"] }),
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-5">Restaurants</h1>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input placeholder="Search restaurants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    {restaurants.map((r: any, i: number) => (
                        <div key={r.id} className={`flex items-center gap-4 px-4 py-3.5 ${i !== restaurants.length - 1 ? "border-b dark:border-zinc-800" : ""}`}>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{r.name}</p>
                                <p className="text-xs text-zinc-500">{r.city} · {r.cuisineTypes?.join(", ")}</p>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[r.status] ?? "bg-zinc-100"}`}>
                                {r.status?.replace("_", " ")}
                            </span>
                            <div className="flex gap-1">
                                {r.status === "PENDING_APPROVAL" && (
                                    <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white" onClick={() => approve.mutate(r.id)}>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                    </Button>
                                )}
                                {r.status !== "SUSPENDED" && r.status !== "PENDING_APPROVAL" && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200" onClick={() => suspend.mutate(r.id)}>
                                        <XCircle className="h-3.5 w-3.5 mr-1" /> Suspend
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {restaurants.length === 0 && <p className="py-10 text-center text-zinc-400 text-sm">No restaurants found</p>}
                </div>
            )}
        </div>
    );
}
