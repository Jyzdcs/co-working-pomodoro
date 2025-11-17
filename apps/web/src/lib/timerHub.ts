import type { TimerState } from "./types";

type RoomId = string;

class TimerHub {
	private timers: Map<RoomId, TimerState> = new Map();

	getTimer(roomId: RoomId): TimerState | null {
		return this.timers.get(roomId) ?? null;
	}

	setTimer(roomId: RoomId, timer: TimerState): void {
		this.timers.set(roomId, timer);
	}

	clearTimer(roomId: RoomId): void {
		this.timers.delete(roomId);
	}

	hasTimer(roomId: RoomId): boolean {
		return this.timers.has(roomId);
	}
}

export const timerHub = new TimerHub();
