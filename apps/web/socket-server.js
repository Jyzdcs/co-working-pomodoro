// Standalone Socket.IO server for deployment on platforms like Railway, Fly.io, Render, etc.
// This can be deployed separately from the Next.js frontend

const { createServer } = require("http");
const { Server } = require("socket.io");

const timerHub = {
	timers: new Map(),
	getTimer(roomId) {
		return this.timers.get(roomId) ?? null;
	},
	setTimer(roomId, timer) {
		this.timers.set(roomId, timer);
	},
	clearTimer(roomId) {
		this.timers.delete(roomId);
	},
};

const roomParticipants = {
	rooms: new Map(),
	addParticipant(roomId, socketId) {
		if (!this.rooms.has(roomId)) {
			this.rooms.set(roomId, new Set());
		}
		this.rooms.get(roomId).add(socketId);
	},
	removeParticipant(roomId, socketId) {
		const participants = this.rooms.get(roomId);
		if (participants) {
			participants.delete(socketId);
			if (participants.size === 0) {
				this.rooms.delete(roomId);
			}
		}
	},
	getParticipantCount(roomId) {
		return this.rooms.get(roomId)?.size ?? 0;
	},
	getAvailableRooms() {
		const rooms = [];
		for (const [roomId, participants] of this.rooms.entries()) {
			if (participants.size > 0) {
				rooms.push({
					roomId,
					participantCount: participants.size,
				});
			}
		}
		return rooms.sort((a, b) => b.participantCount - a.participantCount);
	},
};

const joinEventSchema = {
	parse: (data) => {
		if (!data || typeof data.room !== "string" || data.room.length === 0) {
			throw new Error("Invalid room");
		}
		return { room: data.room };
	},
};

const startEventSchema = {
	parse: (data) => {
		if (
			!data ||
			typeof data.room !== "string" ||
			typeof data.durationMs !== "number" ||
			!["focus", "break"].includes(data.mode)
		) {
			throw new Error("Invalid start payload");
		}
		return {
			room: data.room,
			durationMs: data.durationMs,
			mode: data.mode,
		};
	},
};

const pauseEventSchema = {
	parse: (data) => {
		if (!data || typeof data.room !== "string" || data.room.length === 0) {
			throw new Error("Invalid room");
		}
		return { room: data.room };
	},
};

const restartEventSchema = {
	parse: (data) => {
		if (!data || typeof data.room !== "string" || data.room.length === 0) {
			throw new Error("Invalid room");
		}
		return { room: data.room };
	},
};

const endEventSchema = {
	parse: (data) => {
		if (!data || typeof data.room !== "string" || data.room.length === 0) {
			throw new Error("Invalid room");
		}
		return { room: data.room };
	},
};

const httpServer = createServer((req, res) => {
	// Health check endpoint
	if (req.url === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "ok" }));
		return;
	}

	// Available rooms endpoint
	if (req.url === "/api/rooms") {
		res.writeHead(200, {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		});
		const rooms = roomParticipants.getAvailableRooms();
		res.end(JSON.stringify({ rooms }));
		return;
	}

	res.writeHead(404);
	res.end("Not found");
});

const port = parseInt(process.env.PORT || "3002", 10);
const corsOrigin = process.env.CORS_ORIGIN || "*";

const io = new Server(httpServer, {
	cors: {
		origin: corsOrigin,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

io.on("connection", (socket) => {
	console.log(`Client connected: ${socket.id}`);

	socket.on("join", (data) => {
		try {
			const { room } = joinEventSchema.parse(data);
			socket.join(room);

			roomParticipants.addParticipant(room, socket.id);

			const timer = timerHub.getTimer(room);
			socket.emit("sync", {
				room,
				timer,
				participants: roomParticipants.getParticipantCount(room),
			});

			io.to(room).emit("participants", {
				room,
				count: roomParticipants.getParticipantCount(room),
			});

			console.log(`Client ${socket.id} joined room: ${room}`);
		} catch (error) {
			console.error("Invalid join event:", error);
			socket.emit("error", { message: "Invalid join payload" });
		}
	});

	socket.on("start", (data) => {
		try {
			const { room, durationMs, mode } = startEventSchema.parse(data);
			const timer = {
				start: Date.now(),
				durationMs,
				mode,
			};
			timerHub.setTimer(room, timer);
			io.to(room).emit("sync", { room, timer });
			console.log(
				`Timer started in room ${room}: ${mode} for ${durationMs}ms - synced to all clients`
			);
		} catch (error) {
			console.error("Invalid start event:", error);
			socket.emit("error", { message: "Invalid start payload" });
		}
	});

	socket.on("pause", (data) => {
		try {
			const { room } = pauseEventSchema.parse(data);
			const timer = timerHub.getTimer(room);

			if (!timer) {
				socket.emit("error", { message: "No timer running" });
				return;
			}

			if (timer.pausedAt) {
				const pausedDuration = Date.now() - timer.pausedAt;
				timer.start = timer.start + pausedDuration;
				delete timer.pausedAt;
			} else {
				timer.pausedAt = Date.now();
			}

			timerHub.setTimer(room, timer);
			io.to(room).emit("sync", { room, timer });
			console.log(
				`Timer ${timer.pausedAt ? "paused" : "resumed"} in room ${room} - synced to all clients`
			);
		} catch (error) {
			console.error("Invalid pause event:", error);
			socket.emit("error", { message: "Invalid pause payload" });
		}
	});

	socket.on("restart", (data) => {
		try {
			const { room } = restartEventSchema.parse(data);
			const timer = timerHub.getTimer(room);
			if (!timer) {
				socket.emit("error", { message: "No timer running" });
				return;
			}
			const restartedTimer = {
				start: Date.now(),
				durationMs: timer.durationMs,
				mode: timer.mode,
			};
			timerHub.setTimer(room, restartedTimer);
			io.to(room).emit("sync", { room, timer: restartedTimer });
			console.log(
				`Timer restarted in room ${room} (${restartedTimer.mode}, ${restartedTimer.durationMs}ms) - synced to all clients`
			);
		} catch (error) {
			console.error("Invalid restart event:", error);
			socket.emit("error", { message: "Invalid restart payload" });
		}
	});

	socket.on("end", (data) => {
		try {
			const { room } = endEventSchema.parse(data);
			const timer = timerHub.getTimer(room);
			if (!timer) {
				socket.emit("error", { message: "No timer running" });
				return;
			}
			timerHub.clearTimer(room);
			io.to(room).emit("sync", { room, timer: null });
			console.log(`Timer ended/cleared in room ${room} - synced to all clients`);
		} catch (error) {
			console.error("Invalid end event:", error);
			socket.emit("error", { message: "Invalid end payload" });
		}
	});

	socket.on("disconnect", () => {
		for (const [roomId, participants] of roomParticipants.rooms.entries()) {
			if (participants.has(socket.id)) {
				roomParticipants.removeParticipant(roomId, socket.id);
				io.to(roomId).emit("participants", {
					room: roomId,
					count: roomParticipants.getParticipantCount(roomId),
				});
			}
		}
		console.log(`Client disconnected: ${socket.id}`);
	});
});

// Listen on all interfaces (0.0.0.0) for Railway/deployment
// Railway will automatically assign a public URL
httpServer.listen(port, "0.0.0.0", () => {
	console.log(`Socket.IO server running on port ${port}`);
	console.log(`CORS origin: ${corsOrigin}`);
	console.log(`Server accessible at: http://0.0.0.0:${port}`);
});
