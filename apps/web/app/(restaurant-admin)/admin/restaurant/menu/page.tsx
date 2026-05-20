"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMyRestaurants, useRestaurantMenu, useRestaurantCategories } from "@/lib/api/restaurants";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

export default function MenuPage() {
    const { data: restaurants } = useMyRestaurants();
    const myRestaurants: any[] = restaurants?.data ?? restaurants ?? [];
    const restaurantId = myRestaurants[0]?.id;
    const { data: menuData, isLoading } = useRestaurantMenu(restaurantId ?? "");
    const { data: catData } = useRestaurantCategories(restaurantId ?? "");
    const qc = useQueryClient();
    const categories: any[] = catData?.data ?? catData ?? [];
    const allItems: any[] = (menuData?.categories ?? []).flatMap((c: any) => c.menuItems ?? []);
    const [filter, setFilter] = useState("");
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", description: "", price: "", categoryId: "", isVeg: true });

    const toggleAvailability = useMutation({
        mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
            apiClient.patch(`/v1/restaurants/${restaurantId}/menu/${id}`, { isAvailable }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-menu", restaurantId] }),
    });

    const deleteItem = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/v1/restaurants/${restaurantId}/menu/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-menu", restaurantId] }),
    });

    const createItem = useMutation({
        mutationFn: (data: any) => apiClient.post(`/v1/restaurants/${restaurantId}/menu`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["restaurant-menu", restaurantId] });
            setShowAddItem(false);
            setNewItem({ name: "", description: "", price: "", categoryId: "", isVeg: true });
        },
    });

    const filtered = allItems.filter((i: any) => i.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold">Menu</h1>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowAddItem(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
            </div>

            {/* Add item form */}
            {showAddItem && (
                <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-5 space-y-3">
                    <h2 className="font-bold">New Menu Item</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Item name *" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} />
                        <Input placeholder="Price (₹) *" type="number" value={newItem.price} onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))} />
                    </div>
                    <Input placeholder="Description" value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} />
                    <select value={newItem.categoryId} onChange={(e) => setNewItem((p) => ({ ...p, categoryId: e.target.value }))}
                        className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 text-sm bg-white dark:bg-zinc-900">
                        <option value="">Select category</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={newItem.isVeg} onChange={(e) => setNewItem((p) => ({ ...p, isVeg: e.target.checked }))} />
                        Vegetarian item
                    </label>
                    <div className="flex gap-2">
                        <Button onClick={() => createItem.mutate({ ...newItem, price: Math.round(parseFloat(newItem.price) * 100) })} disabled={!newItem.name || !newItem.price || createItem.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">Save</Button>
                        <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <Input placeholder="Search menu items..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>

            {/* Items table */}
            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-400">No items found</div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                    {filtered.map((item: any, i: number) => (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 ${i !== filtered.length - 1 ? "border-b dark:border-zinc-800" : ""}`}>
                            <span className={`inline-block h-4 w-4 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                                <span className={`block m-0.5 h-2.5 w-2.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-zinc-500">{item.category?.name}</p>
                            </div>
                            <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">{formatRupees(item.price)}</span>
                            <Badge variant={item.isAvailable ? "default" : "secondary"} className={`text-[10px] ${item.isAvailable ? "bg-green-100 text-green-700" : ""}`}>
                                {item.isAvailable ? "Available" : "Hidden"}
                            </Badge>
                            <div className="flex gap-1">
                                <button onClick={() => toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title={item.isAvailable ? "Hide" : "Show"}>
                                    {item.isAvailable ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
                                </button>
                                <button onClick={() => deleteItem.mutate(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950" title="Delete">
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
