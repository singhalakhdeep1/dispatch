import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: { origin: "*", credentials: false },
    namespace: "/",
    transports: ["websocket", "polling"],
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(TrackingGateway.name);

    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    /** Client joins their personal room and optionally an order room */
    @SubscribeMessage("join:room")
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; orderId?: string },
    ) {
        if (data.userId) {
            client.join(`user:${data.userId}`);
            this.logger.debug(`${client.id} joined user:${data.userId}`);
        }
        if (data.orderId) {
            client.join(`order:${data.orderId}`);
            this.logger.debug(`${client.id} joined order:${data.orderId}`);
        }
        return { joined: true };
    }

    @SubscribeMessage("leave:room")
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string },
    ) {
        client.leave(`order:${data.orderId}`);
        return { left: true };
    }

    // ── Emit helpers called by NotificationsService ──────────────────────────

    emitToUser(userId: string, event: string, data: unknown) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    emitToOrder(orderId: string, event: string, data: unknown) {
        this.server.to(`order:${orderId}`).emit(event, data);
    }

    broadcast(event: string, data: unknown) {
        this.server.emit(event, data);
    }
}
