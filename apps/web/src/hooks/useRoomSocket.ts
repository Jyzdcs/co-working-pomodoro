"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { SyncEvent, TimerState, ParticipantsEvent } from "@/lib/types";

// Support both local dev (same server) and production (external socket server like Render)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
const SOCKET_PATH = SOCKET_URL ? "/" : "/api/socket";

export function useRoomSocket(roomId: string | null) {
	const socketRef = useRef<Socket | null>(null);
	const queryClient = useQueryClient();
	const [isConnected, setIsConnected] = useState(false);
	const [participants, setParticipants] = useState<Array<{ socketId: string; username: string }>>([]);
	const [currentSocketId, setCurrentSocketId] = useState<string | null>(null);

	useEffect(() => {
		if (!roomId) return;

		const socketOptions = {
			autoConnect: true,
			reconnection: true,
			path: SOCKET_PATH,
		};

		// If SOCKET_URL is defined (production with external server), use it
		// Otherwise, connect to same server (local dev or Railway full deploy)
		const socket = SOCKET_URL ? io(SOCKET_URL, socketOptions) : io(socketOptions);

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
			setCurrentSocketId(socket.id || null);
			socket.emit("join", { room: roomId });
		});

		socket.on("disconnect", () => {
			console.log("Socket disconnected");
			setIsConnected(false);
			setCurrentSocketId(null);
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
		});

		socket.on("sync", handleSync);

		const handleParticipants = (data: ParticipantsEvent) => {
			console.log("Received participants event:", data);
			setParticipants(data.participants || []);
		};

		socket.on("participants", handleParticipants);

		socket.on("error", (error) => {
			if (error && typeof error === "object" && "message" in error) {
				const message = error.message || String(error);
				// "No timer running" is expected in some cases, log as warning instead
				if (message.includes("No timer running")) {
					console.warn("Socket warning:", message);
				} else {
					console.error("Socket error:", message);
				}
			} else if (error) {
				console.error("Socket error:", error);
			}
			// Ignore empty errors
		});

		return () => {
			socket.off("connect");
			socket.off("sync", handleSync);
			socket.off("participants", handleParticipants);
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

	const emitRename = (username: string) => {
		if (!socketRef.current || !roomId) {
			console.warn("Cannot emit rename: socket or roomId missing");
			return;
		}

		if (!socketRef.current.connected) {
			console.warn("Socket not connected");
			return;
		}

		console.log("Emitting rename event:", { room: roomId, username });
		socketRef.current.emit("rename", {
			room: roomId,
			username,
		});
	};

		return { emitStart, emitPause, emitRestart, emitEnd, emitRename, isConnected, participants, currentSocketId };
}
