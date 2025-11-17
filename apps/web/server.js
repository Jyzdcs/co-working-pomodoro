const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

// Import the timer hub and schemas
// Since we're in CommonJS, we'll need to recreate these or use a different approach
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

// Track room participants
const roomParticipants = {
	rooms: new Map(), // roomId -> Set of socket IDs
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
			data.room.length === 0 ||
			typeof data.durationMs !== "number" ||
			data.durationMs <= 0 ||
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

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	const httpServer = createServer(async (req, res) => {
		try {
			const parsedUrl = parse(req.url, true);

			// Handle API routes manually for available rooms
			if (parsedUrl.pathname === "/api/rooms") {
				res.setHeader("Content-Type", "application/json");
				res.setHeader("Access-Control-Allow-Origin", "*");
				const rooms = roomParticipants.getAvailableRooms();
				res.end(JSON.stringify({ rooms }));
				return;
			}

			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error("Error occurred handling", req.url, err);
			res.statusCode = 500;
			res.end("internal server error");
		}
	});

	const io = new Server(httpServer, {
		path: "/api/socket",
		addTrailingSlash: false,
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	});

	io.on("connection", (socket) => {
		console.log(`Client connected: ${socket.id}`);

		socket.on("join", (data) => {
			try {
				const { room } = joinEventSchema.parse(data);
				socket.join(room);

				// Track participant
				roomParticipants.addParticipant(room, socket.id);

				const timer = timerHub.getTimer(room);
				socket.emit("sync", {
					room,
					timer,
					participants: roomParticipants.getParticipantCount(room),
				});

				// Broadcast participant count to all in room
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

				// Broadcast to all clients in the room
				io.to(room).emit("sync", {
					room,
					timer,
				});

				console.log(
					`Timer started in room ${room}: ${mode} for ${durationMs}ms - synced to all clients`,
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
					// Already paused, resume it
					const pausedDuration = Date.now() - timer.pausedAt;
					timer.start = timer.start + pausedDuration;
					delete timer.pausedAt;
				} else {
					// Pause it
					timer.pausedAt = Date.now();
				}

				timerHub.setTimer(room, timer);

				// Broadcast to all clients in the room
				io.to(room).emit("sync", {
					room,
					timer,
				});

				console.log(
					`Timer ${timer.pausedAt ? "paused" : "resumed"} in room ${room} - synced to all clients`,
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

				// Restart the timer from the beginning (removes pause state if any)
				const restartedTimer = {
					start: Date.now(),
					durationMs: timer.durationMs,
					mode: timer.mode,
					// No pausedAt - timer starts immediately
				};

				timerHub.setTimer(room, restartedTimer);

				// Broadcast to all clients in the room
				io.to(room).emit("sync", {
					room,
					timer: restartedTimer,
				});

				console.log(
					`Timer restarted in room ${room} (${restartedTimer.mode}, ${restartedTimer.durationMs}ms) - synced to all clients`,
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

				// Clear the timer completely
				timerHub.clearTimer(room);

				// Broadcast to all clients in the room that timer is cleared
				io.to(room).emit("sync", {
					room,
					timer: null,
				});

				console.log(`Timer ended/cleared in room ${room} - synced to all clients`);
			} catch (error) {
				console.error("Invalid end event:", error);
				socket.emit("error", { message: "Invalid end payload" });
			}
		});

		socket.on("disconnect", () => {
			// Remove participant from all rooms they were in
			for (const [roomId, participants] of roomParticipants.rooms.entries()) {
				if (participants.has(socket.id)) {
					roomParticipants.removeParticipant(roomId, socket.id);
					// Broadcast updated participant count
					io.to(roomId).emit("participants", {
						room: roomId,
						count: roomParticipants.getParticipantCount(roomId),
					});
				}
			}
			console.log(`Client disconnected: ${socket.id}`);
		});
	});

	httpServer
		.once("error", (err) => {
			console.error(err);
			process.exit(1);
		})
		.listen(port, () => {
			console.log(`> Ready on http://${hostname}:${port}`);
		});
});
