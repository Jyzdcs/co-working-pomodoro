export type TimerMode = "focus" | "break";

export interface TimerState {
	start: number; // timestamp in ms
	durationMs: number; // duration in ms
	mode: TimerMode;
	pausedAt?: number; // timestamp when paused (undefined if running)
}

export interface SyncEvent {
	room: string;
	timer: TimerState | null;
	participants?: number;
}

export interface StartEvent {
	room: string;
	durationMs: number;
	mode: TimerMode;
}

export interface PauseEvent {
	room: string;
}

export interface Participant {
	socketId: string;
	username: string;
}

export interface ParticipantsEvent {
	room: string;
	participants: Participant[];
}

export interface RenameEvent {
	room: string;
	username: string;
}
