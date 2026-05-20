"use client";

import { ShoppingCart, Trash2, Plus, Minus, X, Tag, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart.store";
import { useCart, useClearCart, useUpdateCartItem, useValidatePromo } from "@/lib/api/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState } from "react";

function formatRupees(paise: number) {
    return `₹${(paise / 100).toFixed(2)}`;
}

export function CartDrawer() {
    const { isOpen, closeCart, promoCode, promoDiscount, setPromo, clearPromo } = useCartStore();
    const { data: cart, isLoading } = useCart();
    const clearCartMutation = useClearCart();
    const updateItem = useUpdateCartItem();
    const validatePromo = useValidatePromo();
    const router = useRouter();
    const [promoInput, setPromoInput] = useState("");
    const [promoError, setPromoError] = useState("");

    if (!isOpen) return null;

    const handlePromoApply = async () => {
        if (!promoInput.trim() || !cart) return;
        setPromoError("");
        try {
            const result = await validatePromo.mutateAsync({
                code: promoInput.toUpperCase(),
                orderAmount: cart.itemsTotal,
                restaurantId: cart.restaurantId,
            });
            setPromo(promoInput.toUpperCase(), result.discountAmount);
        } catch {
            setPromoError("Invalid or expired promo code");
        }
    };

    const subtotal = cart?.itemsTotal ?? 0;
    const deliveryFee = cart?.deliveryFee ?? 4900;
    const packagingFee = cart?.packagingFee ?? 200;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + packagingFee + taxes - promoDiscount;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 z-50 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-orange-500" />
                        <h2 className="font-bold text-lg">
                            {cart?.restaurantName ?? "Your Cart"}
                        </h2>
                    </div>
                    <button onClick={closeCart} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {isLoading && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    )}

                    {!isLoading && (!cart?.items || cart.items.length === 0) && (
                        <div className="text-center py-16 text-zinc-400">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Your cart is empty</p>
                        </div>
                    )}

                    {cart?.items?.map((item: any) => (
                        <div key={item.menuItemId} className="flex items-center gap-3">
                            {item.imageUrl && (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`inline-block h-3 w-3 rounded-sm border ${item.isVeg ? "border-green-600" : "border-red-600"}`}
                                    >
                                        <span
                                            className={`block m-0.5 h-2 w-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`}
                                        />
                                    </span>
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {formatRupees(item.price)} each
                                    {item.originalPrice !== item.price && (
                                        <span className="line-through text-zinc-400 ml-1.5">
                                            {formatRupees(item.originalPrice)}
                                        </span>
                                    )}
                                </p>
                            </div>
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950 rounded-lg px-1 py-1">
                                <button
                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-orange-100 dark:hover:bg-orange-900"
                                    onClick={() => updateItem.mutate({ menuItemId: item.menuItemId, quantity: item.quantity - 1 })}
                                    disabled={updateItem.isPending}
                                >
                                    <Minus className="h-3 w-3 text-orange-600" />
                                </button>
                                <span className="text-sm font-semibold text-orange-600 w-4 text-center">
                                    {item.quantity}
                                </span>
                                <button
                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-orange-100 dark:hover:bg-orange-900"
                                    onClick={() => updateItem.mutate({ menuItemId: item.menuItemId, quantity: item.quantity + 1 })}
                                    disabled={updateItem.isPending}
                                >
                                    <Plus className="h-3 w-3 text-orange-600" />
                                </button>
                            </div>
                            <span className="text-sm font-semibold min-w-[52px] text-right">
                                {formatRupees(item.subtotal)}
                            </span>
                        </div>
                    ))}

                    {cart?.items?.length > 0 && (
                        <button
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 mt-2"
                            onClick={() => clearCartMutation.mutate()}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear cart
                        </button>
                    )}
                </div>

                {/* Promo Code */}
                {cart?.items?.length > 0 && (
                    <div className="px-5 py-3 border-t dark:border-zinc-700">
                        {promoCode ? (
                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <Tag className="h-4 w-4" />
                                    <span className="text-sm font-medium">{promoCode}</span>
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        -{formatRupees(promoDiscount)}
                                    </Badge>
                                </div>
                                <button onClick={clearPromo} className="text-zinc-400 hover:text-zinc-600">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Promo code"
                                    value={promoInput}
                                    onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                                    className="h-9 text-sm uppercase"
                                    onKeyDown={(e) => e.key === "Enter" && handlePromoApply()}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePromoApply}
                                    disabled={validatePromo.isPending || !promoInput}
                                    className="h-9"
                                >
                                    {validatePromo.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                                </Button>
                            </div>
                        )}
                        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                    </div>
                )}

                {/* Bill Summary + Checkout */}
                {cart?.items?.length > 0 && (
                    <div className="px-5 pb-6 pt-3 border-t dark:border-zinc-700 space-y-2">
                        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                            <span>Item total</span>
                            <span>{formatRupees(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                            <span>Delivery fee</span>
                            <span>{formatRupees(deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                            <span>Packaging</span>
                            <span>{formatRupees(packagingFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                            <span>GST (5%)</span>
                            <span>{formatRupees(taxes)}</span>
                        </div>
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Promo discount</span>
                                <span>-{formatRupees(promoDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-zinc-700">
                            <span>Total</span>
                            <span>{formatRupees(total)}</span>
                        </div>
                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-2"
                            onClick={() => { closeCart(); router.push("/checkout"); }}
                        >
                            Proceed to Checkout
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
