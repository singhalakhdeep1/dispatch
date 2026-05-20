"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CreditCard, Wallet, Truck, Plus, Check, Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart, useAddresses, useCreateAddress, useInitiatePayment, useVerifyPayment, useValidatePromo } from "@/lib/api/cart";
import { useCartStore } from "@/lib/stores/cart.store";
import { apiClient } from "@/lib/api-client";

declare global {
    interface Window { Razorpay: any; }
}

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(2)}`; }

const PAYMENT_METHODS = [
    { id: "CASH_ON_DELIVERY", label: "Cash on Delivery", icon: Truck, description: "Pay when your order arrives" },
    { id: "UPI", label: "UPI / QR", icon: CreditCard, description: "GPay, PhonePe, Paytm & more" },
    { id: "CARD", label: "Credit / Debit Card", icon: CreditCard, description: "Visa, Mastercard, RuPay" },
    { id: "WALLET", label: "OrderHub Wallet", icon: Wallet, description: "Instant, cashback on every order" },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { data: cart } = useCart();
    const { data: addressList } = useAddresses();
    const createAddress = useCreateAddress();
    const initiatePayment = useInitiatePayment();
    const verifyPayment = useVerifyPayment();
    const validatePromo = useValidatePromo();
    const { promoCode, promoDiscount, setPromo, clearPromo } = useCartStore();

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
    const [promoInput, setPromoInput] = useState("");
    const [promoError, setPromoError] = useState("");
    const [showNewAddress, setShowNewAddress] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [newAddr, setNewAddr] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });

    const addresses: any[] = addressList?.data ?? addressList ?? [];
    const defaultAddress = addresses.find((a: any) => a.isDefault) ?? addresses[0];
    const activeAddressId = selectedAddressId ?? defaultAddress?.id;

    const subtotal = cart?.itemsTotal ?? 0;
    const deliveryFee = cart?.deliveryFee ?? 4900;
    const packagingFee = 200;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + packagingFee + taxes - promoDiscount;

    async function handlePromoApply() {
        setPromoError("");
        try {
            const res = await validatePromo.mutateAsync({
                code: promoInput.toUpperCase(),
                orderAmount: subtotal,
                restaurantId: cart?.restaurantId,
            });
            setPromo(promoInput.toUpperCase(), res.discountAmount);
        } catch {
            setPromoError("Invalid or expired promo code");
        }
    }

    async function handleAddAddress() {
        await createAddress.mutateAsync(newAddr);
        setShowNewAddress(false);
        setNewAddr({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
    }

    async function placeOrder() {
        if (!activeAddressId || !cart?.restaurantId || !cart?.items?.length) return;
        setPlacing(true);
        try {
            // Create order first
            const orderRes = await apiClient.post("/v1/orders", {
                restaurantId: cart.restaurantId,
                deliveryAddressId: activeAddressId,
                items: cart.items.map((i: any) => ({ menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: i.price })),
                promoCode: promoCode ?? undefined,
                paymentMethod,
                deliveryFee,
                packagingFee,
                taxes,
            });

            const order = orderRes.data?.data ?? orderRes.data;

            if (paymentMethod === "CASH_ON_DELIVERY") {
                router.push(`/orders/${order.id}`);
                return;
            }

            // Online payment: initiate Razorpay
            const payRes = await initiatePayment.mutateAsync({ orderId: order.id, method: paymentMethod });
            const { razorpayOrderId, amount, currency, keyId } = payRes;

            const rzp = new window.Razorpay({
                key: keyId,
                amount,
                currency,
                name: "OrderHub",
                description: `Order #${order.id.slice(-6).toUpperCase()}`,
                order_id: razorpayOrderId,
                handler: async (response: any) => {
                    await verifyPayment.mutateAsync({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    });
                    router.push(`/orders/${order.id}`);
                },
                theme: { color: "#f97316" },
            });
            rzp.open();
        } catch (err) {
            console.error(err);
        } finally {
            setPlacing(false);
        }
    }

    if (!cart?.items?.length) {
        return (
            <div className="text-center py-24">
                <div className="text-5xl mb-4">🛒</div>
                <p className="font-semibold text-zinc-600">Your cart is empty</p>
                <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => router.push("/dashboard")}>
                    Browse Restaurants
                </Button>
            </div>
        );
    }

    return (
        <>
            {/* Load Razorpay */}
            <script src="https://checkout.razorpay.com/v1/checkout.js" async />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Checkout</h1>

                <div className="space-y-5">
                    {/* Delivery address */}
                    <section className="rounded-2xl border dark:border-zinc-800 p-5">
                        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-orange-500" /> Delivery Address
                        </h2>

                        <div className="space-y-2">
                            {addresses.map((addr: any) => (
                                <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${activeAddressId === addr.id ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"}`}>
                                    <input
                                        type="radio"
                                        name="address"
                                        value={addr.id}
                                        checked={activeAddressId === addr.id}
                                        onChange={() => setSelectedAddressId(addr.id)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{addr.label}</span>
                                            {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city} - {addr.pincode}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {showNewAddress ? (
                            <div className="mt-3 space-y-2 rounded-xl border dark:border-zinc-700 p-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {["Home", "Work", "Other"].map((l) => (
                                        <button key={l} onClick={() => setNewAddr((p) => ({ ...p, label: l }))} className={`text-sm py-1.5 rounded-lg border ${newAddr.label === l ? "border-orange-400 bg-orange-50 font-semibold" : "border-zinc-200"}`}>{l}</button>
                                    ))}
                                </div>
                                <Input placeholder="Address Line 1 *" value={newAddr.line1} onChange={(e) => setNewAddr((p) => ({ ...p, line1: e.target.value }))} />
                                <Input placeholder="Address Line 2" value={newAddr.line2} onChange={(e) => setNewAddr((p) => ({ ...p, line2: e.target.value }))} />
                                <div className="grid grid-cols-3 gap-2">
                                    <Input placeholder="City *" value={newAddr.city} onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))} />
                                    <Input placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))} />
                                    <Input placeholder="Pincode *" value={newAddr.pincode} onChange={(e) => setNewAddr((p) => ({ ...p, pincode: e.target.value }))} />
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleAddAddress} disabled={!newAddr.line1 || !newAddr.city || !newAddr.pincode || createAddress.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
                                        {createAddress.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Address"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowNewAddress(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowNewAddress(true)} className="flex items-center gap-2 text-sm text-orange-600 font-medium mt-3 hover:text-orange-700">
                                <Plus className="h-4 w-4" /> Add new address
                            </button>
                        )}
                    </section>

                    {/* Payment method */}
                    <section className="rounded-2xl border dark:border-zinc-800 p-5">
                        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-orange-500" /> Payment Method
                        </h2>
                        <div className="space-y-2">
                            {PAYMENT_METHODS.map((pm) => (
                                <label key={pm.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === pm.id ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"}`}>
                                    <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} />
                                    <pm.icon className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm">{pm.label}</p>
                                        <p className="text-xs text-zinc-500">{pm.description}</p>
                                    </div>
                                    {paymentMethod === pm.id && <Check className="h-4 w-4 text-orange-500 ml-auto" />}
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Promo code */}
                    <section className="rounded-2xl border dark:border-zinc-800 p-5">
                        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                            <Tag className="h-5 w-5 text-orange-500" /> Promo Code
                        </h2>
                        {promoCode ? (
                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <Tag className="h-4 w-4" />
                                    <span className="text-sm font-medium">{promoCode}</span>
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">-{formatRupees(promoDiscount)}</Badge>
                                </div>
                                <button onClick={clearPromo}><X className="h-4 w-4 text-zinc-400" /></button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input placeholder="Enter promo code" value={promoInput} onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }} className="h-9 uppercase" onKeyDown={(e) => e.key === "Enter" && handlePromoApply()} />
                                <Button variant="outline" size="sm" onClick={handlePromoApply} disabled={validatePromo.isPending || !promoInput} className="h-9">
                                    {validatePromo.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                                </Button>
                            </div>
                        )}
                        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                    </section>

                    {/* Bill summary */}
                    <section className="rounded-2xl border dark:border-zinc-800 p-5">
                        <h2 className="font-bold text-base mb-3">Bill Details</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400"><span>Item total</span><span>{formatRupees(subtotal)}</span></div>
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400"><span>Delivery fee</span><span>{formatRupees(deliveryFee)}</span></div>
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400"><span>Packaging</span><span>{formatRupees(packagingFee)}</span></div>
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400"><span>GST (5%)</span><span>{formatRupees(taxes)}</span></div>
                            {promoDiscount > 0 && <div className="flex justify-between text-green-600"><span>Promo discount</span><span>-{formatRupees(promoDiscount)}</span></div>}
                            <div className="flex justify-between font-bold text-base border-t dark:border-zinc-700 pt-2"><span>Total</span><span>{formatRupees(total)}</span></div>
                        </div>
                    </section>

                    {/* Order items summary */}
                    <section className="rounded-2xl border dark:border-zinc-800 p-5">
                        <h2 className="font-bold text-base mb-3">Order from {cart.restaurantName}</h2>
                        <div className="space-y-1.5">
                            {cart.items?.map((item: any) => (
                                <div key={item.menuItemId} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                    <span>{item.quantity}× {item.name}</span>
                                    <span>{formatRupees(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Button
                        className="w-full h-12 text-base font-bold bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={!activeAddressId || placing}
                        onClick={placeOrder}
                    >
                        {placing
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Placing order...</>
                            : `Place Order · ${formatRupees(total)}`
                        }
                    </Button>
                </div>
            </div>
        </>
    );
}
