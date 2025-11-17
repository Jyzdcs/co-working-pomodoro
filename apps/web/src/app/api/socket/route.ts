import { NextRequest } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { timerHub } from "@/lib/timerHub";
import { joinEventSchema, startEventSchema } from "@/lib/schemas";
import type { TimerState } from "@/lib/types";

declare global {
	var io: SocketIOServer | undefined;
}

function initSocket(req: NextRequest) {
	if (global.io) {
		return global.io;
	}

	// Try multiple ways to access the HTTP server in Next.js App Router
	const httpServer =
		(req as any).socket?.server ||
		(req as any).node?.req?.socket?.server ||
		(req as any).node?.server;

	if (!httpServer) {
		console.error("HTTP server not available. Request object:", {
			hasSocket: !!(req as any).socket,
			hasNode: !!(req as any).node,
			keys: Object.keys(req as any),
		});
		throw new Error("HTTP server not available");
	}

	const io = new SocketIOServer(httpServer, {
		path: "/api/socket",
		addTrailingSlash: false,
	});

	io.on("connection", (socket) => {
		console.log(`Client connected: ${socket.id}`);

		socket.on("join", (data: unknown) => {
			try {
				const { room } = joinEventSchema.parse(data);
				socket.join(room);

				const timer = timerHub.getTimer(room);
				socket.emit("sync", {
					room,
					timer,
				});

				console.log(`Client ${socket.id} joined room: ${room}`);
			} catch (error) {
				console.error("Invalid join event:", error);
				socket.emit("error", { message: "Invalid join payload" });
			}
		});

		socket.on("start", (data: unknown) => {
			try {
				const { room, durationMs, mode } = startEventSchema.parse(data);

				const timer: TimerState = {
					start: Date.now(),
					durationMs,
					mode,
				};

				timerHub.setTimer(room, timer);

				io.to(room).emit("sync", {
					room,
					timer,
				});

				console.log(
					`Timer started in room ${room}: ${mode} for ${durationMs}ms`,
				);
			} catch (error) {
				console.error("Invalid start event:", error);
				socket.emit("error", { message: "Invalid start payload" });
			}
		});

		socket.on("disconnect", () => {
			console.log(`Client disconnected: ${socket.id}`);
		});
	});

	global.io = io;
	return io;
}

export async function GET(req: NextRequest) {
	try {
		initSocket(req);
		return new Response("Socket.IO server initialized", { status: 200 });
	} catch (error) {
		console.error("Failed to initialize Socket.IO:", error);
		return new Response("Socket server initialization failed", { status: 500 });
	}
}
