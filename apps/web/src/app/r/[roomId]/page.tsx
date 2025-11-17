"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Coffee, Pause, Play, RotateCcw, Square } from "lucide-react";

const FOCUS_DURATION_MS = 25 * 60 * 1000; // 25 minutes
const BREAK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function formatTime(ms: number | null): string {
	if (ms === null) return "00:00";
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatProgress(remainingMs: number | null, durationMs: number): number {
	if (remainingMs === null) return 0;
	return Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));
}

export default function RoomPage() {
	const params = useParams();
	const roomId = Array.isArray(params.roomId)
		? params.roomId[0]
		: params.roomId ?? "";

	const { emitStart, emitPause, emitRestart, emitEnd, isConnected } =
		useRoomSocket(roomId);
	const { remainingMs, isRunning, isPaused, mode } = useCountdown(roomId);

	const handleStartFocus = () => {
		emitStart(FOCUS_DURATION_MS, "focus");
	};

	const handleStartBreak = () => {
		emitStart(BREAK_DURATION_MS, "break");
	};

	const handlePause = () => {
		emitPause();
	};

	const handleRestart = () => {
		emitRestart();
	};

	const handleEnd = () => {
		emitEnd();
	};

	const durationMs = mode === "focus" ? FOCUS_DURATION_MS : BREAK_DURATION_MS;
	const progress = formatProgress(remainingMs, durationMs);

	// Update browser tab title with timer
	useEffect(() => {
		if (mode && remainingMs !== null) {
			const timeStr = formatTime(remainingMs);
			const modeStr = mode === "focus" ? "Focus" : "Break";
			const statusStr = isPaused ? "⏸ " : "";
			document.title = `${statusStr}${timeStr} - ${modeStr} | Pomodoro`;
		} else {
			document.title = "Pomodoro Co-working";
		}

		// Cleanup on unmount
		return () => {
			document.title = "Pomodoro Co-working";
		};
	}, [remainingMs, mode, isPaused]);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold">Room: {roomId}</h1>
				<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
					<div
						className={`size-2 rounded-full ${
							isConnected ? "bg-green-500" : "bg-red-500"
						}`}
					/>
					<span>{isConnected ? "Connected" : "Connecting..."}</span>
				</div>
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{mode === "focus" ? (
							<Timer className="size-5" />
						) : mode === "break" ? (
							<Coffee className="size-5" />
						) : null}
						{mode ? (mode === "focus" ? "Focus" : "Break") : "Waiting to start"}
					</CardTitle>
					<CardDescription>
						{isPaused
							? "Timer is paused"
							: isRunning
								? "Timer is running"
								: mode
									? "Timer finished"
									: "Start a timer to begin"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="text-center">
						<div className="mb-4 font-mono text-7xl font-bold tabular-nums">
							{formatTime(remainingMs)}
						</div>
						{mode && (
							<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									className="h-full bg-primary transition-all duration-300 ease-linear"
									style={{ width: `${progress}%` }}
								/>
							</div>
						)}
					</div>

					<div className="space-y-3">
						{mode && isRunning && !isPaused ? (
							<div className="flex flex-col gap-2">
								<Button
									onClick={handlePause}
									className="w-full"
									size="lg"
									variant="secondary"
								>
									<Pause className="mr-2 size-4" />
									Pause
								</Button>
								<div className="flex gap-2">
									<Button
										onClick={handleRestart}
										className="flex-1"
										size="lg"
										variant="outline"
									>
										<RotateCcw className="mr-2 size-4" />
										Restart
									</Button>
									<Button
										onClick={handleEnd}
										className="flex-1"
										size="lg"
										variant="destructive"
									>
										<Square className="mr-2 size-4" />
										End
									</Button>
								</div>
							</div>
						) : mode && isPaused ? (
							<div className="flex flex-col gap-2">
								<Button
									onClick={handlePause}
									className="w-full"
									size="lg"
									variant="default"
								>
									<Play className="mr-2 size-4" />
									Resume
								</Button>
								<div className="flex gap-2">
									<Button
										onClick={handleRestart}
										className="flex-1"
										size="lg"
										variant="outline"
									>
										<RotateCcw className="mr-2 size-4" />
										Restart
									</Button>
									<Button
										onClick={handleEnd}
										className="flex-1"
										size="lg"
										variant="destructive"
									>
										<Square className="mr-2 size-4" />
										End
									</Button>
								</div>
							</div>
						) : (
							<div className="flex gap-3">
								<Button
									onClick={handleStartFocus}
									disabled={isRunning || isPaused}
									className="flex-1"
									size="lg"
								>
									<Timer className="mr-2 size-4" />
									Start Focus (25m)
								</Button>
								<Button
									onClick={handleStartBreak}
									disabled={isRunning || isPaused}
									variant="outline"
									className="flex-1"
									size="lg"
								>
									<Coffee className="mr-2 size-4" />
									Start Break (5m)
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
