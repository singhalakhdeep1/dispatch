import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useCart() {
    return useQuery({
        queryKey: ["cart"],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/cart");
            return data;
        },
    });
}

export function useAddToCart() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { menuItemId: string; quantity: number }) =>
            apiClient.post("/v1/cart/items", dto).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    });
}

export function useUpdateCartItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ menuItemId, quantity }: { menuItemId: string; quantity: number }) =>
            apiClient.patch(`/v1/cart/items/${menuItemId}`, { quantity }).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    });
}

export function useClearCart() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => apiClient.delete("/v1/cart").then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    });
}

export function useAddresses() {
    return useQuery({
        queryKey: ["addresses"],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/addresses");
            return data;
        },
    });
}

export function useCreateAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: any) => apiClient.post("/v1/addresses", dto).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
    });
}

export function useDeleteAddress() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/v1/addresses/${id}`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
    });
}

export function useValidatePromo() {
    return useMutation({
        mutationFn: (dto: { code: string; orderAmount: number; restaurantId: string }) =>
            apiClient.post("/v1/promos/validate", dto).then((r) => r.data),
    });
}

export function useActivePromos(restaurantId?: string) {
    return useQuery({
        queryKey: ["promos", "active", restaurantId],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/promos/active", {
                params: restaurantId ? { restaurantId } : {},
            });
            return data;
        },
    });
}

export function useInitiatePayment() {
    return useMutation({
        mutationFn: (dto: { orderId: string; method: string }) =>
            apiClient.post("/v1/payments/initiate", dto).then((r) => r.data),
    });
}

export function useVerifyPayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
            apiClient.post("/v1/payments/verify", dto).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["cart"] });
        },
    });
}

export function useWallet() {
    return useQuery({
        queryKey: ["wallet"],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/payments/wallet");
            return data;
        },
    });
}

export function useReviews(restaurantId: string) {
    return useQuery({
        queryKey: ["reviews", restaurantId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/v1/reviews/restaurant/${restaurantId}`);
            return data;
        },
    });
}

export function useCreateReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: any) => apiClient.post("/v1/reviews", dto).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    });
}
