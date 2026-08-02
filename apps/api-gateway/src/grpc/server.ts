// gRPC server for dispatch

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = __dirname + '/dispatch.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const dispatchProto = grpc.loadPackageDefinition(packageDefinition).dispatch;

// Order service
const orderService = {
  CreateOrder: (call, callback) => {
    const { customerId, restaurantId, items } = call.request;
    callback(null, {
      orderId: 'new-order-id',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  },
  GetOrder: (call, callback) => {
    const { orderId } = call.request;
    callback(null, {
      orderId,
      customerId: '1',
      restaurantId: '1',
      driverId: '1',
      status: 'in_progress',
      total: 25.99,
      createdAt: new Date().toISOString(),
    });
  },
  UpdateOrderStatus: (call, callback) => {
    const { orderId, status } = call.request;
    callback(null, {
      orderId,
      status,
      updatedAt: new Date().toISOString(),
    });
  },
};

// Driver service
const driverService = {
  GetDriver: (call, callback) => {
    const { driverId } = call.request;
    callback(null, {
      driverId,
      name: 'John Driver',
      email: 'driver@example.com',
      phone: '+1234567890',
      vehicleType: 'car',
      status: 'available',
      rating: 4.5,
    });
  },
  UpdateDriverLocation: (call, callback) => {
    const { driverId, lat, lng } = call.request;
    callback(null, {
      driverId,
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    });
  },
  GetAvailableDrivers: (call, callback) => {
    const { lat, lng, radius } = call.request;
    callback(null, {
      drivers: [],
    });
  },
};

// Start gRPC server
const server = new grpc.Server();
server.addService(dispatchProto.Order.service, orderService);
server.addService(dispatchProto.Driver.service, driverService);

const PORT = process.env.GRPC_PORT || 50051;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error(`Failed to start gRPC server: ${error}`);
    return;
  }
  console.log(`gRPC server running on port ${port}`);
});
