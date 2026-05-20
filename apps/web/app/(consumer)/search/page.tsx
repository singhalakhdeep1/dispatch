"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { useRestaurants } from "@/lib/api/restaurants";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 400);

    const { data, isLoading, isFetching } = useRestaurants({
        search: debouncedQuery || undefined,
    });

    const results: any[] = data?.data ?? [];

    return (
        <div>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                    placeholder="Search restaurants, cuisines, or dishes..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 pr-10 h-12 text-base rounded-2xl"
                    autoFocus
                />
                {query && (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setQuery("")}>
                        <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                    </button>
                )}
            </div>

            {!debouncedQuery && (
                <div className="text-center py-16 text-zinc-400">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Start typing to search restaurants and cuisines</p>
                </div>
            )}

            {debouncedQuery && (
                <>
                    {(isLoading || isFetching) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3].map((i) => <div key={i} className="h-60 rounded-2xl bg-zinc-100 animate-pulse" />)}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="font-medium">No results for "{debouncedQuery}"</p>
                            <p className="text-sm mt-1">Try different keywords</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-zinc-500 mb-4">{results.length} result{results.length !== 1 ? "s" : ""} for "{debouncedQuery}"</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {results.map((r: any) => <RestaurantCard key={r.id} restaurant={r} />)}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
