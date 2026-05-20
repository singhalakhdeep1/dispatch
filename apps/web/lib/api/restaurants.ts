import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface RestaurantsParams {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
    cuisine?: string;
    search?: string;
    isVeg?: boolean;
    minRating?: number;
    sortBy?: string;
}

export function useRestaurants(params: RestaurantsParams) {
    return useQuery({
        queryKey: ["restaurants", params],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/restaurants", { params });
            return data;
        },
        enabled: true,
    });
}

export function useRestaurant(id: string) {
    return useQuery({
        queryKey: ["restaurant", id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/v1/restaurants/${id}`);
            return data?.data ?? data;
        },
        enabled: !!id,
    });
}

export function useRestaurantMenu(restaurantId: string) {
    return useQuery({
        queryKey: ["restaurant-menu", restaurantId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/v1/restaurants/${restaurantId}/menu`);
            return data?.data ?? data;
        },
        enabled: !!restaurantId,
    });
}

export function useRestaurantCategories(restaurantId: string) {
    return useQuery({
        queryKey: ["restaurant-categories", restaurantId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/v1/restaurants/${restaurantId}/categories`);
            return data?.data ?? data;
        },
        enabled: !!restaurantId,
    });
}

export function useMyRestaurants() {
    return useQuery({
        queryKey: ["my-restaurants"],
        queryFn: async () => {
            const { data } = await apiClient.get("/v1/restaurants/mine");
            return data?.data ?? data;
        },
    });
}

export function useRestaurantAnalytics(restaurantId: string, days = 30) {
    return useQuery({
        queryKey: ["restaurant-analytics", restaurantId, days],
        queryFn: async () => {
            const { data } = await apiClient.get(`/v1/restaurants/${restaurantId}/analytics`, { params: { days } });
            return data?.data ?? data;
        },
        enabled: !!restaurantId,
    });
}

