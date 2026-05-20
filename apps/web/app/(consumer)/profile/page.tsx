"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { User, MapPin, Wallet, Package, ChevronRight, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/api/cart";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(2)}`; }

export default function ProfilePage() {
    const { data: session } = useSession();
    const { data: walletData } = useWallet();
    const router = useRouter();

    const user = session?.user;
    const balance = walletData?.balance ?? 0;

    const MENU = [
        { href: "/profile/addresses", label: "Saved Addresses", icon: MapPin, sub: "Manage delivery addresses" },
        { href: "/profile/wallet", label: "OrderHub Wallet", icon: Wallet, sub: formatRupees(balance) + " balance" },
        { href: "/orders", label: "My Orders", icon: Package, sub: "Track and reorder" },
        { href: "/notifications", label: "Notifications", icon: Bell, sub: "Order updates & offers" },
    ];

    return (
        <div className="max-w-lg mx-auto">
            {/* Profile card */}
            <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-5 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                    {user?.image
                        ? <img src={user.image} alt="" className="h-16 w-16 rounded-full object-cover" />
                        : <User className="h-8 w-8 text-orange-500" />
                    }
                </div>
                <div>
                    <h1 className="text-xl font-bold">{user?.name ?? "Guest"}</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                </div>
            </div>

            {/* Menu items */}
            <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden mb-5">
                {MENU.map((item, i) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${i !== MENU.length - 1 ? "border-b dark:border-zinc-800" : ""}`}
                    >
                        <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                            <item.icon className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{item.label}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.sub}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                ))}
            </div>

            <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => signOut({ callbackUrl: "/login" })}
            >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </Button>
        </div>
    );
}
