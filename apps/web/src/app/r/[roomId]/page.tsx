"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useCountdown } from "@/hooks/useCountdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Timer, Coffee, Pause, Play, RotateCcw, Square } from "lucide-react";
import { ParticipantsList } from "@/components/participants-list";

const FOCUS_DURATION_MS = 25 * 60 * 1000; // 25 minutes
const BREAK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function formatTime(ms: number | null): string {
  if (ms === null) return "00:00";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatProgress(
  remainingMs: number | null,
  durationMs: number
): number {
  if (remainingMs === null) return 0;
  return Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Array.isArray(params.roomId)
    ? params.roomId[0]
    : params.roomId ?? "";

  const {
    emitStart,
    emitPause,
    emitRestart,
    emitEnd,
    emitRename,
    isConnected,
    participants,
    currentSocketId,
  } = useRoomSocket(roomId);
  const { remainingMs, isRunning, isPaused, mode } = useCountdown(roomId);

  const [showAlert, setShowAlert] = useState(false);
  const [finishedMode, setFinishedMode] = useState<"focus" | "break" | null>(
    null
  );
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownAlertRef = useRef(false);
  const alarmDurationRef = useRef(3000); // 3 seconds default

  const handleStartFocus = () => {
    emitStart(FOCUS_DURATION_MS, "focus");
  };

  const handleStartBreak = () => {
    emitStart(BREAK_DURATION_MS, "break");
  };

  const handlePause = () => {
    // Only pause if timer exists and is running
    if (mode && remainingMs !== null) {
      emitPause();
    }
  };

  const handleRestart = () => {
    // Only restart if timer exists
    if (mode) {
      emitRestart();
    }
  };

  const stopAlert = () => {
    setShowAlert(false);
    hasShownAlertRef.current = false;
    stopAlarm();
  };

  const handleEnd = () => {
    // Only end if timer exists
    if (mode) {
      emitEnd();
    }
    stopAlert();
  };

  const stopAlarm = useCallback(() => {
    // Stop the alarm sound but keep popup visible
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  }, []);

  const handleLaunchBreak = () => {
    // Launch break for everyone via socket
    emitStart(BREAK_DURATION_MS, "break");
    // Stop alarm and close popup for this user only (alarm is individual)
    stopAlert();
  };

  const handleLaunchFocus = () => {
    // Launch focus for everyone via socket
    emitStart(FOCUS_DURATION_MS, "focus");
    // Stop alarm and close popup for this user only (alarm is individual)
    stopAlert();
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

  // Play beep sound function - useCallback to keep reference stable
  const playBeep = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Error playing beep:", error);
    }
  }, []);

  // Detect timer finished and show alert
  useEffect(() => {
    // Timer finished: remainingMs is 0, timer was running, and we have a mode
    // Only show alert once per timer finish
    if (
      mode &&
      remainingMs === 0 &&
      !isRunning &&
      !isPaused &&
      !showAlert &&
      !hasShownAlertRef.current
    ) {
      setFinishedMode(mode);
      setShowAlert(true);
      hasShownAlertRef.current = true;

      // Play initial 3 beeps
      playBeep();
      const timeout1 = setTimeout(() => playBeep(), 600);
      const timeout2 = setTimeout(() => playBeep(), 1200);

      // Play beep every 0.8 seconds in a loop - start after initial 3 beeps
      audioIntervalRef.current = setInterval(() => {
        playBeep();
      }, 800);

      // Stop alarm after 3 seconds (default duration) - but popup stays visible
      alertTimeoutRef.current = setTimeout(() => {
        if (audioIntervalRef.current) {
          clearInterval(audioIntervalRef.current);
          audioIntervalRef.current = null;
        }
      }, alarmDurationRef.current);

      // Cleanup only the initial timeouts
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }

    // Reset hasShownAlert when timer starts again or mode changes
    if (isRunning || !mode || remainingMs === null || remainingMs > 0) {
      hasShownAlertRef.current = false;
    }
  }, [mode, remainingMs, isRunning, isPaused, showAlert, playBeep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, [stopAlarm]);

  // Note: Alarm and popups are now individual - each user manages their own
  // No automatic stop when timer starts globally
  // Popups stay visible until user manually dismisses them

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Timer finished alert */}
      {showAlert && finishedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <Card className="border-2 border-primary shadow-2xl">
              <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="animate-bounce">
                    {finishedMode === "focus" ? (
                      <Timer className="size-16 text-primary" />
                    ) : (
                      <Coffee className="size-16 text-primary" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-3xl">
                  {finishedMode === "focus"
                    ? "Pomodoro Complete! 🎉"
                    : "Break Complete! ☕"}
                </CardTitle>
                <CardDescription className="text-lg">
                  {finishedMode === "focus"
                    ? "Great work! Time for a well-deserved break."
                    : "Break is over. Ready to focus again?"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {finishedMode === "focus" ? (
                  <Button
                    onClick={handleLaunchBreak}
                    className="w-full"
                    size="lg"
                    variant="default"
                  >
                    <Coffee className="mr-2 size-4" />
                    Start Break (5m)
                  </Button>
                ) : (
                  <Button
                    onClick={handleLaunchFocus}
                    className="w-full"
                    size="lg"
                    variant="default"
                  >
                    <Timer className="mr-2 size-4" />
                    Start Focus (25m)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
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
          <ParticipantsList
            participants={participants}
            currentSocketId={currentSocketId}
            onRename={emitRename}
          />
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" size="lg" variant="outline">
                        <RotateCcw className="mr-2 size-4" />
                        Restart
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restart Timer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to restart the timer? This will
                          reset it to the beginning.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestart}>
                          Restart
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="flex-1"
                        size="lg"
                        variant="destructive"
                      >
                        <Square className="mr-2 size-4" />
                        End
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End Timer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to end the timer? This will stop
                          it completely and clear it for everyone in the room.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleEnd}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          End Timer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" size="lg" variant="outline">
                        <RotateCcw className="mr-2 size-4" />
                        Restart
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restart Timer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to restart the timer? This will
                          reset it to the beginning.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestart}>
                          Restart
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="flex-1"
                        size="lg"
                        variant="destructive"
                      >
                        <Square className="mr-2 size-4" />
                        End
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End Timer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to end the timer? This will stop
                          it completely and clear it for everyone in the room.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleEnd}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          End Timer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
