import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    id: string;
    menuItemId: string;
    name: string;
    price: number;       // paise (effective price)
    originalPrice: number;
    imageUrl?: string;
    isVeg: boolean;
    quantity: number;
    subtotal: number;
}

interface CartState {
    restaurantId: string | null;
    restaurantName: string;
    items: CartItem[];
    promoCode: string | null;
    promoDiscount: number; // paise
    isOpen: boolean;

    // Actions
    openCart: () => void;
    closeCart: () => void;
    setPromo: (code: string, discount: number) => void;
    clearPromo: () => void;
    clearCart: () => void;

    // Computed helpers (called inline)
    itemCount: () => number;
    itemsTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            restaurantId: null,
            restaurantName: "",
            items: [],
            promoCode: null,
            promoDiscount: 0,
            isOpen: false,

            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            setPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),
            clearPromo: () => set({ promoCode: null, promoDiscount: 0 }),

            clearCart: () => set({
                restaurantId: null,
                restaurantName: "",
                items: [],
                promoCode: null,
                promoDiscount: 0,
            }),

            itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            itemsTotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
        }),
        {
            name: "orderhub-cart",
            partialize: (state) => ({
                restaurantId: state.restaurantId,
                restaurantName: state.restaurantName,
                items: state.items,
                promoCode: state.promoCode,
                promoDiscount: state.promoDiscount,
            }),
        },
    ),
);
