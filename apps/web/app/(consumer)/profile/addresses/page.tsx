"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Home, Briefcase, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAddresses, useCreateAddress, useDeleteAddress } from "@/lib/api/cart";

const LABEL_ICONS: Record<string, any> = {
    Home: Home,
    Work: Briefcase,
    Other: MapPinned,
};

export default function AddressesPage() {
    const { data, isLoading } = useAddresses();
    const createAddress = useCreateAddress();
    const deleteAddress = useDeleteAddress();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false });

    const addresses: any[] = data?.data ?? data ?? [];

    async function handleCreate() {
        await createAddress.mutateAsync(form);
        setShowForm(false);
        setForm({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false });
    }

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold">Saved Addresses</h1>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add New
                </Button>
            </div>

            {/* Address form */}
            {showForm && (
                <div className="rounded-2xl border dark:border-zinc-800 p-5 mb-5 space-y-3">
                    <h2 className="font-semibold">New Address</h2>
                    <div className="flex gap-2">
                        {["Home", "Work", "Other"].map((l) => (
                            <button key={l} onClick={() => setForm((p) => ({ ...p, label: l }))}
                                className={`flex-1 py-2 text-sm rounded-xl border font-medium transition-colors ${form.label === l ? "border-orange-400 bg-orange-50 text-orange-600" : "border-zinc-200"}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <Input placeholder="Address Line 1 *" value={form.line1} onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))} />
                    <Input placeholder="Address Line 2 (optional)" value={form.line2} onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="City *" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                        <Input placeholder="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
                        <Input placeholder="Pincode *" value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />
                        Set as default address
                    </label>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={!form.line1 || !form.city || !form.pincode || createAddress.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
                            Save
                        </Button>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />)}</div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-16 text-zinc-400">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No saved addresses yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((addr: any) => {
                        const Icon = LABEL_ICONS[addr.label] ?? MapPin;
                        return (
                            <div key={addr.id} className="rounded-2xl border dark:border-zinc-800 p-4 flex items-start gap-3 bg-white dark:bg-zinc-900">
                                <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                                    <Icon className="h-5 w-5 text-orange-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-semibold text-sm">{addr.label}</span>
                                        {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}{addr.state ? `, ${addr.state}` : ""} - {addr.pincode}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteAddress.mutate(addr.id)}
                                    disabled={deleteAddress.isPending}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
