"use client";

import { useState } from "react";
import { Users, Edit2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Participant {
	socketId: string;
	username: string;
}

interface ParticipantsListProps {
	participants: Participant[];
	currentSocketId: string | null;
	onRename: (username: string) => void;
}

export function ParticipantsList({
	participants,
	currentSocketId,
	onRename,
}: ParticipantsListProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [newUsername, setNewUsername] = useState("");

	const currentUser = participants.find((p) => p.socketId === currentSocketId);

	const handleRename = () => {
		if (newUsername.trim() && newUsername.trim().length <= 30) {
			onRename(newUsername.trim());
			setNewUsername("");
			setIsEditing(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Users className="size-4" />
					{participants.length} {participants.length === 1 ? "user" : "users"}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80 p-0">
				<Card className="border-0 shadow-none">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg flex items-center gap-2">
							<Users className="size-5" />
							Participants
						</CardTitle>
						<CardDescription>
							{participants.length} {participants.length === 1 ? "person" : "people"} in this room
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{/* Rename section for current user */}
						{currentUser && (
							<div className="pb-3 border-b space-y-2">
								<div className="text-sm font-medium text-muted-foreground">
									Your name
								</div>
								{!isEditing ? (
									<div className="flex items-center justify-between gap-2">
										<span className="font-semibold">{currentUser.username}</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setNewUsername(currentUser.username);
												setIsEditing(true);
											}}
											className="h-8 w-8 p-0"
										>
											<Edit2 className="size-4" />
										</Button>
									</div>
								) : (
									<div className="flex items-center gap-2">
										<Input
											value={newUsername}
											onChange={(e) => setNewUsername(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleRename();
												if (e.key === "Escape") {
													setIsEditing(false);
													setNewUsername("");
												}
											}}
											placeholder="Enter your name"
											maxLength={30}
											className="flex-1"
											autoFocus
										/>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleRename}
											disabled={!newUsername.trim()}
											className="h-8 w-8 p-0"
										>
											<Check className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setIsEditing(false);
												setNewUsername("");
											}}
											className="h-8 w-8 p-0"
										>
											<X className="size-4" />
										</Button>
									</div>
								)}
							</div>
						)}

						{/* Participants list */}
						<div className="space-y-1 max-h-64 overflow-y-auto">
							{participants.map((participant) => (
								<div
									key={participant.socketId}
									className={`flex items-center gap-2 p-2 rounded-md ${
										participant.socketId === currentSocketId
											? "bg-primary/10"
											: "bg-muted/50"
									}`}
								>
									<div className="size-2 rounded-full bg-primary" />
									<span
										className={`text-sm ${
											participant.socketId === currentSocketId
												? "font-semibold"
												: ""
										}`}
									>
										{participant.username}
										{participant.socketId === currentSocketId && " (You)"}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
