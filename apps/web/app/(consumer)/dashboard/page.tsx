"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Leaf, Star, Bike } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { useRestaurants } from "@/lib/api/restaurants";

const CUISINES = ["All", "North Indian", "South Indian", "Chinese", "Pizza", "Biryani", "Burger", "Desserts", "Healthy", "Fast Food"];
const SORT_OPTIONS = [
    { label: "Relevance", value: "relevance" },
    { label: "Rating", value: "rating" },
    { label: "Delivery time", value: "deliveryTime" },
    { label: "Price: Low to High", value: "priceAsc" },
];

export default function DashboardPage() {
    const [search, setSearch] = useState("");
    const [cuisine, setCuisine] = useState("");
    const [isVeg, setIsVeg] = useState(false);
    const [minRating, setMinRating] = useState<number | undefined>();
    const [sortBy, setSortBy] = useState("relevance");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => setCoords({ lat: 19.076, lng: 72.8777 }),
        );
    }, []);

    const { data, isLoading } = useRestaurants({
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: 10,
        cuisine: cuisine || undefined,
        search: search || undefined,
        isVeg: isVeg || undefined,
        minRating,
        sortBy,
    } as any);

    const restaurants = data?.data ?? [];

    return (
        <div>
            {/* Hero header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {coords ? "Restaurants near you 📍" : "All Restaurants 🍽️"}
                </h1>
                <p className="text-zinc-500 mt-1">Fresh food, delivered fast</p>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Search for restaurants, cuisines, or dishes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                />
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                    onClick={() => setIsVeg(!isVeg)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${isVeg
                        ? "bg-green-600 text-white border-green-600"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-green-500 hover:text-green-600"
                        }`}
                >
                    <Leaf className="h-3.5 w-3.5" />
                    Pure Veg
                </button>

                <button
                    onClick={() => setMinRating(minRating ? undefined : 4)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${minRating
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-yellow-500 hover:text-yellow-600"
                        }`}
                >
                    <Star className="h-3.5 w-3.5" />
                    Ratings 4.0+
                </button>

                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:border-blue-500 hover:text-blue-600"
                >
                    <Bike className="h-3.5 w-3.5" />
                    Free Delivery
                </button>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="ml-auto px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-medium bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Cuisine chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {CUISINES.map((c) => (
                    <button
                        key={c}
                        onClick={() => setCuisine(c === "All" ? "" : c)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${(c === "All" && !cuisine) || cuisine === c
                            ? "bg-orange-500 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : restaurants.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                    <div className="text-5xl mb-4">🍽️</div>
                    <p className="font-medium">No restaurants found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {restaurants.map((r: any) => (
                        <RestaurantCard key={r.id} restaurant={r} />
                    ))}
                </div>
            )}
        </div>
    );
}
