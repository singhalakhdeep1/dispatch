import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useOrders(page = 1, limit = 20) {
    return useQuery({
        queryKey: ["orders", page],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/orders", { params: { page, limit } });
            return data;
        },
    });
}

export function useOrder(id: string) {
    return useQuery({
        queryKey: ["order", id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/v1/orders/${id}`);
            return data?.data ?? data;
        },
        enabled: !!id,
        refetchInterval: 15_000, // poll every 15s as fallback
    });
}

export function usePlaceOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            restaurantId: string;
            deliveryAddressId: string;
            items: { menuItemId: string; quantity: number }[];
            notes?: string;
        }) => {
            const { data } = await apiClient.post("/v1/orders", payload);
            return data?.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
            const { data } = await apiClient.patch(`/v1/orders/${id}/cancel`, { reason });
            return data;
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["order", id] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}
