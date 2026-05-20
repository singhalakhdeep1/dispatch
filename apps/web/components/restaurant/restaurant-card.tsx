"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Bike, Leaf, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RestaurantCardProps {
    restaurant: {
        id: string;
        name: string;
        description?: string;
        logoUrl?: string;
        coverUrl?: string;
        cuisineTypes: string[];
        averageRating: number;
        totalRatings: number;
        avgDeliveryMinutes: number;
        deliveryFee: number;
        minOrderAmount: number;
        isVeg: boolean;
        isOpen: boolean;
        discount?: string;
    };
}

function formatRupees(paise: number) {
    return `₹${(paise / 100).toFixed(0)}`;
}

export function RestaurantCard({ restaurant: r }: RestaurantCardProps) {
    return (
        <Link href={`/restaurant/${r.id}`} className="group block">
            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow bg-white dark:bg-zinc-900">
                {/* Cover image */}
                <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800">
                    {r.coverUrl ? (
                        <Image
                            src={r.coverUrl}
                            alt={r.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                            🍽️
                        </div>
                    )}

                    {/* Badges on image */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                        {r.isVeg && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Leaf className="h-2.5 w-2.5" /> Pure Veg
                            </span>
                        )}
                        {r.discount && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {r.discount}
                            </span>
                        )}
                    </div>

                    {!r.isOpen && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-white text-zinc-800 font-semibold text-sm px-3 py-1 rounded-full">
                                Currently Closed
                            </span>
                        </div>
                    )}

                    {/* Logo */}
                    {r.logoUrl && (
                        <div className="absolute bottom-2 left-3 h-10 w-10 rounded-xl overflow-hidden border-2 border-white shadow">
                            <Image src={r.logoUrl} alt="" fill className="object-cover" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-tight">
                            {r.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                            <Star className="h-3 w-3 fill-white" />
                            {r.averageRating > 0 ? r.averageRating.toFixed(1) : "New"}
                        </div>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {r.cuisineTypes.join(" • ")}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {r.avgDeliveryMinutes} mins
                        </span>
                        <span className="flex items-center gap-1">
                            <Bike className="h-3.5 w-3.5" />
                            {r.deliveryFee === 0 ? "Free delivery" : `${formatRupees(r.deliveryFee)} delivery`}
                        </span>
                        {r.minOrderAmount > 0 && (
                            <span>Min {formatRupees(r.minOrderAmount)}</span>
                        )}
                    </div>

                    {r.totalRatings > 0 && (
                        <p className="text-[10px] text-zinc-400 mt-1">{r.totalRatings.toLocaleString()} ratings</p>
                    )}
                </div>
            </div>
        </Link>
    );
}
