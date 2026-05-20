"use client";

import { useState } from "react";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

export default function AdminPromosPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: "", description: "", discountType: "PERCENT", discountValue: "", maxDiscount: "", minOrderAmount: "" });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-promos"],
        queryFn: async () => {
            const res = await apiClient.get("/v1/promos/active");
            return res.data?.data ?? res.data ?? [];
        },
    });

    const promos: any[] = Array.isArray(data) ? data : [];

    const createPromo = useMutation({
        mutationFn: (d: any) => apiClient.post("/v1/promos", d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promos"] }); setShowForm(false); setForm({ code: "", description: "", discountType: "PERCENT", discountValue: "", maxDiscount: "", minOrderAmount: "" }); },
    });

    const togglePromo = useMutation({
        mutationFn: (id: string) => apiClient.patch(`/v1/promos/${id}/toggle`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promos"] }),
    });

    const handleCreate = () => {
        createPromo.mutate({
            ...form,
            discountValue: form.discountType === "PERCENT" ? parseInt(form.discountValue) : Math.round(parseFloat(form.discountValue) * 100),
            maxDiscount: form.maxDiscount ? Math.round(parseFloat(form.maxDiscount) * 100) : undefined,
            minOrderAmount: form.minOrderAmount ? Math.round(parseFloat(form.minOrderAmount) * 100) : 0,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold">Promo Codes</h1>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Create
                </Button>
            </div>

            {showForm && (
                <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-5 space-y-3">
                    <h2 className="font-bold">New Promo Code</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Code (e.g. SAVE50) *" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
                        <select value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                            className="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 text-sm bg-white dark:bg-zinc-900">
                            <option value="PERCENT">Percentage (%)</option>
                            <option value="FLAT">Flat (₹)</option>
                        </select>
                    </div>
                    <Input placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-3">
                        <Input placeholder={form.discountType === "PERCENT" ? "Discount %" : "Discount ₹"} type="number" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} />
                        <Input placeholder="Max discount ₹" type="number" value={form.maxDiscount} onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))} />
                        <Input placeholder="Min order ₹" type="number" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={!form.code || !form.discountValue || createPromo.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">Save</Button>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    {promos.map((p: any, i: number) => (
                        <div key={p.id} className={`flex items-center gap-4 px-4 py-3.5 ${i !== promos.length - 1 ? "border-b dark:border-zinc-800" : ""}`}>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm font-mono">{p.code}</p>
                                <p className="text-xs text-zinc-500">{p.description} · Min order {formatRupees(p.minOrderAmount ?? 0)}</p>
                            </div>
                            <span className="text-sm font-semibold text-orange-600">
                                {p.discountType === "PERCENT" ? `${p.discountValue}%` : formatRupees(p.discountValue)} off
                                {p.maxDiscount ? ` (max ${formatRupees(p.maxDiscount)})` : ""}
                            </span>
                            <button onClick={() => togglePromo.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                {p.isActive
                                    ? <ToggleRight className="h-5 w-5 text-green-500" />
                                    : <ToggleLeft className="h-5 w-5 text-zinc-400" />
                                }
                            </button>
                        </div>
                    ))}
                    {promos.length === 0 && <p className="py-10 text-center text-zinc-400 text-sm">No promo codes yet</p>}
                </div>
            )}
        </div>
    );
}
