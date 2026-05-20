"use client";

import { useState } from "react";
import { useMyRestaurants } from "@/lib/api/restaurants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RestaurantSettingsPage() {
    const { data: restaurants } = useMyRestaurants();
    const myRestaurants: any[] = restaurants?.data ?? restaurants ?? [];
    const restaurant = myRestaurants[0];
    const qc = useQueryClient();
    const [form, setForm] = useState({
        name: restaurant?.name ?? "",
        description: restaurant?.description ?? "",
        phone: restaurant?.phone ?? "",
        deliveryFee: restaurant ? (restaurant.deliveryFee / 100).toString() : "",
        minOrderAmount: restaurant ? (restaurant.minOrderAmount / 100).toString() : "",
        preparationTime: restaurant?.preparationTime?.toString() ?? "",
    });

    const update = useMutation({
        mutationFn: (data: any) => apiClient.patch(`/v1/restaurants/${restaurant?.id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-restaurants"] }),
    });

    const toggleOpen = useMutation({
        mutationFn: () => apiClient.patch(`/v1/restaurants/${restaurant?.id}`, { isOpen: !restaurant?.isOpen }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-restaurants"] }),
    });

    if (!restaurant) return <div className="text-zinc-400 py-16 text-center">Loading restaurant data...</div>;

    const handleSave = () => {
        update.mutate({
            ...form,
            deliveryFee: Math.round(parseFloat(form.deliveryFee) * 100),
            minOrderAmount: Math.round(parseFloat(form.minOrderAmount) * 100),
            preparationTime: parseInt(form.preparationTime),
        });
    };

    return (
        <div className="max-w-xl">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold">Settings</h1>
                <div className="flex items-center gap-3">
                    <Badge variant={restaurant.isOpen ? "default" : "secondary"} className={restaurant.isOpen ? "bg-green-100 text-green-700" : ""}>
                        {restaurant.isOpen ? "Open" : "Closed"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleOpen.mutate()} disabled={toggleOpen.isPending}>
                        Toggle {restaurant.isOpen ? "Closed" : "Open"}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Restaurant Name</label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full rounded-lg border dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Phone</label>
                    <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Delivery Fee (₹)</label>
                        <Input type="number" value={form.deliveryFee} onChange={(e) => setForm((p) => ({ ...p, deliveryFee: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Min Order (₹)</label>
                        <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Prep Time (min)</label>
                        <Input type="number" value={form.preparationTime} onChange={(e) => setForm((p) => ({ ...p, preparationTime: e.target.value }))} />
                    </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSave} disabled={update.isPending}>
                    {update.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {update.isSuccess && <p className="text-sm text-green-600 text-center">Settings saved!</p>}
            </div>
        </div>
    );
}
