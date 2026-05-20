import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getSession } from "next-auth/react";

interface Options {
    onOrderRequest: (order: any) => void;
}

export function useDriverSocket({ onOrderRequest }: Options) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        let s: Socket;

        (async () => {
            const session = await getSession();
            const userId = (session?.user as any)?.id;

            s = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3004", {
                transports: ["websocket"],
            });

            s.on("connect", () => {
                if (userId) s.emit("join:room", { room: `user:${userId}` });
            });

            s.on("order:new-request", (data: any) => onOrderRequest(data));

            socketRef.current = s;
        })();

        return () => { s?.disconnect(); };
    }, []);
}
