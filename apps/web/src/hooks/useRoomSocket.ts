"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { SyncEvent, TimerState } from "@/lib/types";

const SOCKET_PATH = "/api/socket";

export function useRoomSocket(roomId: string | null) {
	const socketRef = useRef<Socket | null>(null);
	const queryClient = useQueryClient();
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		if (!roomId) return;

		const socket = io({
			path: SOCKET_PATH,
			autoConnect: true,
			reconnection: true,
		});

		socketRef.current = socket;

		const handleSync = (data: SyncEvent) => {
			console.log("Received sync event:", data);
			queryClient.setQueryData<TimerState | null>(
				["timer", roomId],
				data.timer,
			);
		};

		socket.on("connect", () => {
			console.log("Socket connected:", socket.id);
			setIsConnected(true);
			socket.emit("join", { room: roomId });
		});

		socket.on("disconnect", () => {
			console.log("Socket disconnected");
			setIsConnected(false);
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
		});

		socket.on("sync", handleSync);

		socket.on("error", (error) => {
			console.error("Socket error:", error);
		});

		return () => {
			socket.off("connect");
			socket.off("sync", handleSync);
			socket.off("disconnect");
			socket.off("connect_error");
			socket.off("error");
			socket.disconnect();
		};
	}, [roomId, queryClient]);

	const emitStart = (durationMs: number, mode: "focus" | "break") => {
		if (!socketRef.current || !roomId) {
			console.warn("Cannot emit start: socket or roomId missing", {
				hasSocket: !!socketRef.current,
				roomId,
			});
			return;
		}

		if (!socketRef.current.connected) {
			console.warn("Socket not connected, attempting to connect...");
			socketRef.current.connect();
			// Wait a bit for connection, then emit
			setTimeout(() => {
				if (socketRef.current?.connected) {
					console.log("Emitting start event:", { room: roomId, durationMs, mode });
					socketRef.current.emit("start", {
						room: roomId,
						durationMs,
						mode,
					});
				} else {
					console.error("Socket still not connected after timeout");
				}
			}, 500);
			return;
		}

		console.log("Emitting start event:", { room: roomId, durationMs, mode });
		socketRef.current.emit("start", {
			room: roomId,
			durationMs,
			mode,
		});
	};

	const emitPause = () => {
		if (!socketRef.current || !roomId) {
			console.warn("Cannot emit pause: socket or roomId missing");
			return;
		}

		if (!socketRef.current.connected) {
			console.warn("Socket not connected");
			return;
		}

		console.log("Emitting pause event:", { room: roomId });
		socketRef.current.emit("pause", {
			room: roomId,
		});
	};

	const emitRestart = () => {
		if (!socketRef.current || !roomId) {
			console.warn("Cannot emit restart: socket or roomId missing");
			return;
		}

		if (!socketRef.current.connected) {
			console.warn("Socket not connected");
			return;
		}

		console.log("Emitting restart event:", { room: roomId });
		socketRef.current.emit("restart", {
			room: roomId,
		});
	};

	const emitEnd = () => {
		if (!socketRef.current || !roomId) {
			console.warn("Cannot emit end: socket or roomId missing");
			return;
		}

		if (!socketRef.current.connected) {
			console.warn("Socket not connected");
			return;
		}

		console.log("Emitting end event:", { room: roomId });
		socketRef.current.emit("end", {
			room: roomId,
		});
	};

	return { emitStart, emitPause, emitRestart, emitEnd, isConnected };
}
