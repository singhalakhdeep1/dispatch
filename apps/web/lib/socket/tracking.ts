import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3004", {
            transports: ["websocket"],
            autoConnect: false,
        });
    }
    return socket;
}

export function joinUserRoom(userId: string) {
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit("join:room", { room: `user:${userId}` });
}

export function joinOrderRoom(orderId: string) {
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit("join:room", { room: `order:${orderId}` });
}

export function leaveRoom(room: string) {
    getSocket().emit("leave:room", { room });
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
