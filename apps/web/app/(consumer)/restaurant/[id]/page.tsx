"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
    Star, Clock, Bike, MapPin, ChevronRight, Plus, Minus, Leaf,
    Share2, Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRestaurant, useRestaurantMenu } from "@/lib/api/restaurants";
import { useAddToCart, useUpdateCartItem, useCart } from "@/lib/api/cart";
import { useCartStore } from "@/lib/stores/cart.store";
import { ReviewSection } from "@/components/review/review-section";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

export default function RestaurantPage() {
    const { id } = useParams<{ id: string }>();
    const { data: restaurant, isLoading } = useRestaurant(id);
    const { data: menuData } = useRestaurantMenu(id);
    const { data: cart } = useCart();
    const addToCart = useAddToCart();
    const updateItem = useUpdateCartItem();
    const openCart = useCartStore((s) => s.openCart);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [tab, setTab] = useState<"menu" | "reviews" | "info">("menu");

    if (isLoading) return (
        <div className="animate-pulse space-y-4">
            <div className="h-52 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
    );
    if (!restaurant) return <div className="py-20 text-center text-zinc-400">Restaurant not found</div>;

    const categories: any[] = menuData?.categories ?? [];
    const allItems: any[] = categories.flatMap((c: any) => c.menuItems ?? []);
    const filteredItems = activeCategory ? allItems.filter((i: any) => i.categoryId === activeCategory) : allItems;

    function getQty(menuItemId: string) {
        return cart?.items?.find((i: any) => i.menuItemId === menuItemId)?.quantity ?? 0;
    }

    async function handleAdd(menuItemId: string) {
        const q = getQty(menuItemId);
        if (q === 0) await addToCart.mutateAsync({ menuItemId, quantity: 1 });
        else await updateItem.mutateAsync({ menuItemId, quantity: q + 1 });
        openCart();
    }

    async function handleRemove(menuItemId: string) {
        const q = getQty(menuItemId);
        if (q > 0) await updateItem.mutateAsync({ menuItemId, quantity: q - 1 });
    }

    return (
        <div className="pb-24">
            {/* Hero */}
            <div className="relative h-52 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-4">
                {restaurant.coverUrl
                    ? <Image src={restaurant.coverUrl} alt={restaurant.name} fill className="object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">🍽️</div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                    <button className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow"><Share2 className="h-4 w-4 text-zinc-700" /></button>
                    <button className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow"><Heart className="h-4 w-4 text-zinc-700" /></button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                    <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                    <p className="text-sm text-white/80">{restaurant.cuisineTypes?.join(" • ")}</p>
                </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 mb-4 px-1">
                <div className="flex items-center gap-1 bg-green-700 text-white px-2 py-0.5 rounded font-semibold text-xs">
                    <Star className="h-3 w-3 fill-white" />
                    {restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : "New"}
                </div>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{restaurant.avgDeliveryMinutes ?? 30} mins</span>
                <span className="flex items-center gap-1"><Bike className="h-3.5 w-3.5" />{restaurant.deliveryFee === 0 ? "Free" : formatRupees(restaurant.deliveryFee)} delivery</span>
                {restaurant.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{restaurant.address.city}</span>}
                <Badge className={restaurant.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} variant="secondary">
                    {restaurant.isOpen ? "Open" : "Closed"}
                </Badge>
                {restaurant.isVeg && <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><Leaf className="h-3.5 w-3.5" />Pure Veg</span>}
            </div>

            {/* Tabs */}
            <div className="flex border-b dark:border-zinc-800 mb-5">
                {(["menu", "reviews", "info"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? "border-orange-500 text-orange-500" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
                        {t}
                    </button>
                ))}
            </div>

            {tab === "menu" && (
                <div className="flex gap-6">
                    {categories.length > 1 && (
                        <div className="hidden md:block w-44 flex-shrink-0">
                            <div className="sticky top-20 space-y-1">
                                <button onClick={() => setActiveCategory(null)} className={`w-full text-left text-sm px-3 py-2 rounded-lg ${!activeCategory ? "bg-orange-50 text-orange-600 font-semibold" : "text-zinc-500 hover:bg-zinc-100"}`}>All</button>
                                {categories.map((c: any) => (
                                    <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`w-full text-left text-sm px-3 py-2 rounded-lg ${activeCategory === c.id ? "bg-orange-50 text-orange-600 font-semibold" : "text-zinc-500 hover:bg-zinc-100"}`}>{c.name}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex-1 space-y-3">
                        {filteredItems.map((item: any) => {
                            const qty = getQty(item.id);
                            return (
                                <div key={item.id} className={`flex gap-4 p-4 rounded-xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 ${!item.isAvailable ? "opacity-50" : ""}`}>
                                    <div className="pt-0.5">
                                        <span className={`inline-block h-4 w-4 rounded-sm border-2 ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                                            <span className={`block m-0.5 h-2.5 w-2.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm">{item.name}</h3>
                                        {item.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-sm">{formatRupees(item.discountedPrice ?? item.price)}</span>
                                            {item.discountedPrice && item.discountedPrice < item.price && (
                                                <span className="text-xs text-zinc-400 line-through">{formatRupees(item.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                        {item.imageUrl && (
                                            <div className="relative h-20 w-20 rounded-xl overflow-hidden">
                                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                            </div>
                                        )}
                                        {item.isAvailable ? (
                                            qty === 0 ? (
                                                <Button size="sm" variant="outline" className="h-8 px-5 text-orange-600 border-orange-400 hover:bg-orange-50 font-bold" onClick={() => handleAdd(item.id)} disabled={addToCart.isPending}>ADD</Button>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-orange-500 rounded-lg px-1.5 py-1">
                                                    <button className="h-6 w-6 flex items-center justify-center text-white" onClick={() => handleRemove(item.id)}><Minus className="h-3.5 w-3.5" /></button>
                                                    <span className="text-white text-sm font-bold w-4 text-center">{qty}</span>
                                                    <button className="h-6 w-6 flex items-center justify-center text-white" onClick={() => handleAdd(item.id)}><Plus className="h-3.5 w-3.5" /></button>
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-zinc-400">Unavailable</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {tab === "reviews" && <ReviewSection restaurantId={id} />}

            {tab === "info" && (
                <div className="space-y-4 max-w-lg">
                    {restaurant.address && (
                        <div className="rounded-xl border dark:border-zinc-800 p-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" />Address</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{restaurant.address.line1}, {restaurant.address.city} - {restaurant.address.pincode}</p>
                        </div>
                    )}
                    {restaurant.description && (
                        <div className="rounded-xl border dark:border-zinc-800 p-4">
                            <h3 className="font-semibold mb-1">About</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{restaurant.description}</p>
                        </div>
                    )}
                </div>
            )}

            {(cart?.itemCount ?? 0) > 0 && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
                    <button onClick={openCart} className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full shadow-xl font-semibold transition-colors">
                        <span className="bg-orange-700 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">{cart.itemCount}</span>
                        View Cart
                        <span className="text-orange-200">{formatRupees(cart.itemsTotal)}</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
}
