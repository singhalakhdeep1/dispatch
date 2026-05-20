import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, Users, ShoppingBag, Tag, Settings } from "lucide-react";

const NAV = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/restaurants", label: "Restaurants", icon: Store },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/promos", label: "Promo Codes", icon: Tag },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect("/login");
    if ((session as any)?.role !== "ADMIN") redirect("/dashboard");

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <aside className="hidden md:flex w-56 flex-col bg-white dark:bg-zinc-900 border-r dark:border-zinc-800 px-3 py-5 flex-shrink-0">
                <div className="flex items-center gap-2 px-2 mb-6">
                    <span className="text-2xl">🛡️</span>
                    <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">OrderHub</p>
                        <p className="text-[10px] text-zinc-500">Super Admin</p>
                    </div>
                </div>
                <nav className="space-y-1 flex-1">
                    {NAV.map((item) => (
                        <Link key={item.href} href={item.href}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-2">← Back to app</Link>
            </aside>
            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800">
                    <span className="text-xl">🛡️</span>
                    <span className="font-bold text-sm">Admin Panel</span>
                </header>
                <main className="flex-1 p-5 md:p-8">{children}</main>
            </div>
        </div>
    );
}
