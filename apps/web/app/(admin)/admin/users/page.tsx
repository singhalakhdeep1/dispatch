"use client";

import { useState } from "react";
import { Search, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ROLE_COLOR: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    RESTAURANT_OWNER: "bg-blue-100 text-blue-700",
    DRIVER: "bg-yellow-100 text-yellow-700",
    CUSTOMER: "bg-zinc-100 text-zinc-600",
};

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-users", search],
        queryFn: async () => {
            const res = await apiClient.get("/v1/admin/users", { params: { search: search || undefined, pageSize: 50 } });
            return res.data?.data ?? res.data ?? [];
        },
    });

    const users: any[] = Array.isArray(data) ? data : [];

    const toggleBan = useMutation({
        mutationFn: ({ id, isBanned }: { id: string; isBanned: boolean }) =>
            apiClient.patch(`/v1/admin/users/${id}`, { isBanned }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-5">Users</h1>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    {users.map((u: any, i: number) => (
                        <div key={u.id} className={`flex items-center gap-4 px-4 py-3.5 ${i !== users.length - 1 ? "border-b dark:border-zinc-800" : ""}`}>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{u.fullName}</p>
                                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${ROLE_COLOR[u.role] ?? "bg-zinc-100"}`}>{u.role}</span>
                            {u.isBanned && (
                                <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-600 flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" /> Banned
                                </span>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className={`h-7 text-xs ${u.isBanned ? "text-green-600 border-green-200" : "text-red-500 border-red-200"}`}
                                onClick={() => toggleBan.mutate({ id: u.id, isBanned: !u.isBanned })}
                                disabled={u.role === "ADMIN"}
                            >
                                {u.isBanned ? "Unban" : "Ban"}
                            </Button>
                        </div>
                    ))}
                    {users.length === 0 && <p className="py-10 text-center text-zinc-400 text-sm">No users found</p>}
                </div>
            )}
        </div>
    );
}
