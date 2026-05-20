export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-orange-500">🛵 Driver App</h1>
                    <p className="mt-2 text-gray-500">OrderHub Delivery Partner</p>
                </div>
                {children}
            </div>
        </div>
    );
}
