"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimerState } from "@/lib/types";

export function useCountdown(roomId: string | null) {
	const [remainingMs, setRemainingMs] = useState<number | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const queryClient = useQueryClient();

	const { data: timer } = useQuery<TimerState | null>({
		queryKey: ["timer", roomId],
		enabled: !!roomId,
		refetchInterval: false,
		queryFn: () => {
			return queryClient.getQueryData<TimerState | null>(["timer", roomId]) ?? null;
		},
	});

	useEffect(() => {
		if (!timer) {
			setRemainingMs(null);
			setIsRunning(false);
			return;
		}

		const updateRemaining = () => {
			const now = Date.now();
			
			// If paused, use the paused timestamp to calculate remaining
			if (timer.pausedAt) {
				const elapsed = timer.pausedAt - timer.start;
				const remaining = timer.durationMs - elapsed;
				setRemainingMs(Math.max(0, remaining));
				setIsRunning(false);
				return;
			}

			const elapsed = now - timer.start;
			const remaining = timer.durationMs - elapsed;

			if (remaining <= 0) {
				setRemainingMs(0);
				setIsRunning(false);
				return;
			}

			setRemainingMs(remaining);
			setIsRunning(true);
		};

		updateRemaining();
		const interval = setInterval(updateRemaining, 250);

		return () => clearInterval(interval);
	}, [timer]);

	const isPaused = timer?.pausedAt !== undefined;

	return { remainingMs, isRunning, isPaused, mode: timer?.mode ?? null };
}
