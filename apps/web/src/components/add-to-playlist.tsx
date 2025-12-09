"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ListPlus,
	Plus,
	Check,
	Loader2,
	ListMusic,
} from "lucide-react";

interface AddToPlaylistButtonProps {
	videoId: string;
	variant?: "icon" | "full";
	className?: string;
}

export function AddToPlaylistButton({
	videoId,
	variant = "icon",
	className,
}: AddToPlaylistButtonProps) {
	const [isCreating, setIsCreating] = useState(false);
	const [newPlaylistName, setNewPlaylistName] = useState("");

	const { data: playlists } = trpc.playlist.getAll.useQuery();
	const utils = trpc.useUtils();

	const createPlaylist = trpc.playlist.create.useMutation({
		onSuccess: async (playlist) => {
			// Add video to the new playlist
			await addToPlaylist.mutateAsync({
				playlistId: playlist.id,
				videoId,
			});
			utils.playlist.getAll.invalidate();
			setIsCreating(false);
			setNewPlaylistName("");
			toast.success(`Added to "${playlist.name}"`);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const addToPlaylist = trpc.playlist.addVideo.useMutation({
		onSuccess: () => {
			toast.success("Added to playlist");
		},
		onError: (error) => {
			if (error.message.includes("already in playlist")) {
				toast.info("Already in this playlist");
			} else {
				toast.error(error.message);
			}
		},
	});

	const handleCreateAndAdd = () => {
		if (!newPlaylistName.trim()) return;
		createPlaylist.mutate({ name: newPlaylistName });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{variant === "icon" ? (
					<Button variant="ghost" size="icon" className={className}>
						<ListPlus className="w-5 h-5" />
					</Button>
				) : (
					<Button variant="secondary" className={className}>
						<ListPlus className="w-4 h-4 mr-2" />
						Add to Playlist
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64">
				{/* Create new playlist */}
				{isCreating ? (
					<div className="p-2">
						<div className="flex gap-2">
							<Input
								value={newPlaylistName}
								onChange={(e) => setNewPlaylistName(e.target.value)}
								placeholder="Playlist name"
								className="h-8 text-sm"
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Enter") handleCreateAndAdd();
									if (e.key === "Escape") setIsCreating(false);
								}}
							/>
							<Button
								size="sm"
								className="h-8 px-3"
								disabled={!newPlaylistName.trim() || createPlaylist.isPending}
								onClick={handleCreateAndAdd}
							>
								{createPlaylist.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
							</Button>
						</div>
					</div>
				) : (
					<DropdownMenuItem onClick={() => setIsCreating(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Create new playlist
					</DropdownMenuItem>
				)}

				{playlists && playlists.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<div className="max-h-60 overflow-y-auto">
							{playlists.map((playlist) => (
								<DropdownMenuItem
									key={playlist.id}
									onClick={() => {
										addToPlaylist.mutate({
											playlistId: playlist.id,
											videoId,
										});
									}}
									disabled={addToPlaylist.isPending}
								>
									<ListMusic
										className="w-4 h-4 mr-2"
										style={{ color: playlist.color ?? undefined }}
									/>
									<span className="flex-1 truncate">{playlist.name}</span>
									<span className="text-xs text-muted-foreground ml-2">
										{playlist.videoCount}
									</span>
								</DropdownMenuItem>
							))}
						</div>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
