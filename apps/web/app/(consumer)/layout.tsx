import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { CartDrawer } from "@/components/cart/cart-drawer";

export default async function ConsumerLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar user={session?.user} />
            <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">{children}</main>
            <CartDrawer />
        </div>
    );
}

