"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@orderhub/ui";
import { usePlaceOrder } from "@/lib/api/orders";
import { formatMoney } from "@orderhub/shared";

interface CartItem {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
}

interface Props {
    restaurantId: string;
    items: CartItem[];
    onClose: () => void;
}

export function PlaceOrderForm({ restaurantId, items, onClose }: Props) {
    const router = useRouter();
    const [deliveryAddressId, setDeliveryAddressId] = useState("");
    const [notes, setNotes] = useState("");
    const { mutateAsync: placeOrder, isPending } = usePlaceOrder();

    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    async function handleConfirm() {
        if (!deliveryAddressId.trim()) return;
        const order = await placeOrder({
            restaurantId,
            deliveryAddressId,
            items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
            notes: notes || undefined,
        });
        router.push(`/order/${order.id}`);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
            <Card className="w-full max-w-md rounded-t-2xl sm:rounded-2xl">
                <CardHeader>
                    <CardTitle>Confirm Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        {items.map((i) => (
                            <div key={i.menuItemId} className="flex justify-between text-sm">
                                <span>{i.name} × {i.quantity}</span>
                                <span>{formatMoney(i.unitPrice * i.quantity)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-bold border-t pt-2">
                            <span>Subtotal</span>
                            <span>{formatMoney(total)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Delivery Address ID</label>
                        <Input
                            placeholder="Address UUID"
                            value={deliveryAddressId}
                            onChange={(e) => setDeliveryAddressId(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">
                            Full address management coming soon
                        </p>
                    </div>

                    <Input
                        placeholder="Special instructions (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                        <Button
                            className="flex-1"
                            onClick={handleConfirm}
                            isLoading={isPending}
                            disabled={!deliveryAddressId.trim()}
                        >
                            Place Order
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
