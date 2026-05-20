import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "OrderHub — Food Delivery",
    description: "Order your favourite food, delivered fast",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#f97316",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen bg-gray-50 font-sans antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
