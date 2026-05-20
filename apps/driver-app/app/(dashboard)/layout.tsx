export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white px-4 py-3 flex items-center gap-2">
                <span className="text-xl">🛵</span>
                <span className="font-bold text-orange-500">OrderHub Driver</span>
            </header>
            <main className="container mx-auto max-w-lg px-4 py-6">{children}</main>
        </div>
    );
}
