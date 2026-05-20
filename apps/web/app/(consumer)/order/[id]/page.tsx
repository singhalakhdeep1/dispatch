"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock, Bike, MapPin, PhoneCall } from "lucide-react";
import { TrackingView } from "@/components/order/tracking-view";
import { useOrder } from "@/lib/api/orders";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

const STEPS = ["PLACED", "FINDING_DRIVER", "DRIVER_ASSIGNED", "PICKED_UP", "DELIVERED"] as const;
const STEP_LABELS: Record<string, string> = {
    PLACED: "Order Placed",
    FINDING_DRIVER: "Finding Driver",
    DRIVER_ASSIGNED: "Driver Assigned",
    PICKED_UP: "On the Way",
    DELIVERED: "Delivered",
};
const STATUS_COLOR: Record<string, string> = {
    PLACED: "bg-zinc-100 text-zinc-600",
    FINDING_DRIVER: "bg-blue-100 text-blue-700",
    DRIVER_ASSIGNED: "bg-blue-100 text-blue-700",
    PICKED_UP: "bg-orange-100 text-orange-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
};

export default function OrderPage() {
    const { id } = useParams<{ id: string }>();
    const { data: order, isLoading } = useOrder(id);

    if (isLoading) return (
        <div className="max-w-2xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
        </div>
    );
    if (!order) return (
        <div className="text-center py-20 text-zinc-400">
            <p>Order not found</p>
            <Link href="/orders" className="text-sm text-orange-500 mt-2 hover:underline">← Back to orders</Link>
        </div>
    );

    const currentStep = STEPS.indexOf(order.status as any);
    const isCancelled = order.status === "CANCELLED";

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back */}
            <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-5">
                <ChevronLeft className="h-4 w-4" /> All Orders
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{order.restaurant?.name}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_COLOR[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {STEP_LABELS[order.status] ?? order.status.replace(/_/g, " ")}
                </span>
            </div>

            {/* Progress stepper */}
            {!isCancelled && (
                <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-4">
                    <div className="relative flex items-center justify-between">
                        {/* connector line */}
                        <div className="absolute left-0 right-0 top-4 h-0.5 bg-zinc-100 dark:bg-zinc-800 -z-0" />
                        <div className="absolute left-0 top-4 h-0.5 bg-orange-400 -z-0 transition-all"
                            style={{ width: currentStep >= 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : "0%" }} />
                        {STEPS.map((step, i) => (
                            <div key={step} className="flex flex-col items-center gap-1.5 z-10">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${i <= currentStep ? "bg-orange-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i === currentStep ? <Clock className="h-4 w-4 animate-pulse" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                </div>
                                <span className="text-[10px] text-zinc-500 text-center max-w-[52px] leading-tight hidden sm:block">{STEP_LABELS[step]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live tracking map */}
            {["DRIVER_ASSIGNED", "PICKED_UP"].includes(order.status) && (
                <div className="mb-4">
                    <TrackingView orderId={id} driverId={order.driverId} />
                </div>
            )}

            {/* Driver card */}
            {order.driver && (
                <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                        <Bike className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{order.driver.name}</p>
                        <p className="text-xs text-zinc-400">{order.driver.vehicleNumber}</p>
                    </div>
                    {order.driver.phone && (
                        <a href={`tel:${order.driver.phone}`} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200">
                            <PhoneCall className="h-4 w-4 text-zinc-600" />
                        </a>
                    )}
                </div>
            )}

            {/* Delivery address */}
            {order.address && (
                <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-4 flex gap-3">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium">Delivery Address</p>
                        <p className="text-sm text-zinc-500">{order.address.line1}, {order.address.city} {order.address.pincode}</p>
                    </div>
                </div>
            )}

            {/* Order items */}
            <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <h2 className="font-semibold mb-3">Order Summary</h2>
                <div className="space-y-2 mb-3">
                    {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-zinc-700 dark:text-zinc-300">{item.name ?? item.menuItem?.name} <span className="text-zinc-400">× {item.quantity}</span></span>
                            <span className="font-medium">{formatRupees(item.subtotal ?? item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t dark:border-zinc-800 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-500">
                        <span>Delivery fee</span>
                        <span>{formatRupees(order.deliveryFee ?? 0)}</span>
                    </div>
                    {order.packagingFee > 0 && (
                        <div className="flex justify-between text-zinc-500">
                            <span>Packaging</span>
                            <span>{formatRupees(order.packagingFee)}</span>
                        </div>
                    )}
                    {order.taxAmount > 0 && (
                        <div className="flex justify-between text-zinc-500">
                            <span>Taxes & charges</span>
                            <span>{formatRupees(order.taxAmount)}</span>
                        </div>
                    )}
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatRupees(order.discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t dark:border-zinc-800">
                        <span>Total</span>
                        <span>{formatRupees(order.totalAmount ?? 0)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
