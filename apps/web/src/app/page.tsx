"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice6, Users, ArrowRight } from "lucide-react";

function generateRoomId(): string {
	return Math.random().toString(36).substring(2, 8);
}

interface AvailableRoom {
	roomId: string;
	participantCount: number;
}

async function fetchAvailableRooms(): Promise<AvailableRoom[]> {
	const response = await fetch("/api/rooms");
	const data = await response.json();
	return data.rooms || [];
}

export default function Home() {
	const [roomId, setRoomId] = useState("");
	const router = useRouter();

	const { data: availableRooms = [] } = useQuery({
		queryKey: ["availableRooms"],
		queryFn: fetchAvailableRooms,
		refetchInterval: 3000, // Refresh every 3 seconds
	});

	const handleJoinRoom = (id: string) => {
		router.push(`/r/${id}`);
	};

	const handleJoin = () => {
		if (!roomId.trim()) return;
		router.push(`/r/${roomId.trim()}`);
	};

	const handleRandomRoom = () => {
		const randomId = generateRoomId();
		router.push(`/r/${randomId}`);
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<div className="mb-8 text-center">
				<h1 className="mb-2 text-4xl font-bold">Pomodoro Co-working</h1>
				<p className="text-muted-foreground">
					Join a room and focus together with your team
				</p>
			</div>

			{availableRooms.length > 0 && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="size-5" />
							Available Rooms
						</CardTitle>
						<CardDescription>
							Rooms with active participants
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{availableRooms.map((room) => (
								<Button
									key={room.roomId}
									onClick={() => handleJoinRoom(room.roomId)}
									variant="outline"
									className="w-full justify-between"
								>
									<div className="flex items-center gap-2">
										<span className="font-mono font-semibold">
											{room.roomId}
										</span>
										<span className="flex items-center gap-1 text-sm text-muted-foreground">
											<Users className="size-3" />
											{room.participantCount}
										</span>
									</div>
									<ArrowRight className="size-4" />
								</Button>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Enter Room</CardTitle>
					<CardDescription>
						Enter a room ID or create a random one
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-2">
						<Input
							placeholder="room-id"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleJoin();
							}}
							className="flex-1"
						/>
						<Button onClick={handleJoin} disabled={!roomId.trim()}>
							Join
						</Button>
					</div>
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">or</span>
						</div>
					</div>
					<Button
						onClick={handleRandomRoom}
						variant="outline"
						className="w-full"
					>
						<Dice6 className="mr-2 size-4" />
						Create Random Room
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
