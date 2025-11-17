import { z } from "zod";

export const joinEventSchema = z.object({
	room: z.string().min(1),
});

export const startEventSchema = z.object({
	room: z.string().min(1),
	durationMs: z.number().int().positive(),
	mode: z.enum(["focus", "break"]),
});

export const pauseEventSchema = z.object({
	room: z.string().min(1),
});

export const restartEventSchema = z.object({
	room: z.string().min(1),
});

export const endEventSchema = z.object({
	room: z.string().min(1),
});
