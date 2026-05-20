"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@orderhub/ui";
import { ShoppingCart, Search, User, Wallet, Bell } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import { useCart } from "@/lib/api/cart";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Props {
    user?: { name?: string | null; email?: string | null } | null;
}

export function Navbar({ user }: Props) {
    const pathname = usePathname();
    const openCart = useCartStore((s) => s.openCart);
    const { data: cart } = useCart();
    const itemCount = cart?.itemCount ?? 0;

    const { data: notifData } = useQuery({
        queryKey: ["notifications-unread-count"],
        queryFn: async () => {
            const res = await apiClient.get("/v1/notifications?unreadOnly=true&pageSize=1");
            return res.data?.unreadCount ?? 0;
        },
        refetchInterval: 60_000,
    });
    const unreadNotifs: number = notifData ?? 0;

    return (
        <header className="sticky top-0 z-50 border-b bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-2xl">🍕</span>
                    <span className="text-xl font-bold text-orange-500">OrderHub</span>
                </Link>

                {/* Search bar */}
                <Link
                    href="/search"
                    className="hidden md:flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors w-64"
                >
                    <Search className="h-4 w-4" />
                    Search restaurants or dishes...
                </Link>

                <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                    <Link
                        href="/dashboard"
                        className={pathname === "/dashboard" ? "text-orange-500" : "text-gray-600 dark:text-zinc-400 hover:text-gray-900"}
                    >
                        Restaurants
                    </Link>
                    <Link
                        href="/orders"
                        className={pathname?.startsWith("/orders") ? "text-orange-500" : "text-gray-600 dark:text-zinc-400 hover:text-gray-900"}
                    >
                        My Orders
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    {/* Cart button */}
                    <button
                        onClick={openCart}
                        className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Open cart"
                    >
                        <ShoppingCart className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                        {itemCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                                {itemCount > 9 ? "9+" : itemCount}
                            </span>
                        )}
                    </button>

                    {/* Wallet */}
                    <Link
                        href="/profile/wallet"
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Wallet"
                    >
                        <Wallet className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                    </Link>

                    {/* Notifications */}
                    <Link
                        href="/notifications"
                        className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                        {unreadNotifs > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                {unreadNotifs > 9 ? "9+" : unreadNotifs}
                            </span>
                        )}
                    </Link>

                    {/* Profile */}
                    <Link
                        href="/profile"
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Profile"
                    >
                        <User className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                    </Link>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="hidden md:flex"
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </header>
    );
}
