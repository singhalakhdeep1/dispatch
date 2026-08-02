// GraphQL resolvers for dispatch

export const resolvers = {
  Query: {
    getOrder: async (_: any, { id }: { id: string }) => {
      return {
        id,
        customerId: '1',
        restaurantId: '1',
        driverId: '1',
        status: 'in_progress',
        items: [],
        total: 25.99,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    getOrders: async (_: any, { customerId, status }: { customerId: string; status: string }) => {
      return [];
    },
    getDriver: async (_: any, { id }: { id: string }) => {
      return {
        id,
        name: 'John Driver',
        email: 'driver@example.com',
        phone: '+1234567890',
        vehicleType: 'car',
        status: 'available',
        currentLocation: { lat: 40.7128, lng: -74.0060 },
        rating: 4.5,
      };
    },
    getAvailableDrivers: async (_: any, { location }: { location: any }) => {
      return [];
    },
    getRestaurant: async (_: any, { id }: { id: string }) => {
      return {
        id,
        name: 'Sample Restaurant',
        address: '123 Main St',
        location: { lat: 40.7128, lng: -74.0060 },
        rating: 4.2,
        isOpen: true,
      };
    },
    getNearbyRestaurants: async (_: any, { location, radius }: { location: any; radius: number }) => {
      return [];
    },
  },
  Mutation: {
    createOrder: async (_: any, { input }: { input: any }) => {
      return {
        id: 'new-order-id',
        customerId: input.customerId,
        restaurantId: input.restaurantId,
        driverId: null,
        status: 'pending',
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    updateOrderStatus: async (_: any, { orderId, status }: { orderId: string; status: string }) => {
      return {
        id: orderId,
        customerId: '1',
        restaurantId: '1',
        driverId: '1',
        status,
        items: [],
        total: 25.99,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    assignDriver: async (_: any, { orderId, driverId }: { orderId: string; driverId: string }) => {
      return {
        id: orderId,
        customerId: '1',
        restaurantId: '1',
        driverId,
        status: 'assigned',
        items: [],
        total: 25.99,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    updateDriverLocation: async (_: any, { driverId, location }: { driverId: string; location: any }) => {
      return {
        id: driverId,
        name: 'John Driver',
        email: 'driver@example.com',
        phone: '+1234567890',
        vehicleType: 'car',
        status: 'available',
        currentLocation: location,
        rating: 4.5,
      };
    },
  },
};
