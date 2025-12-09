"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
	Play,
	MoreVertical,
	Trash2,
	ChevronLeft,
	Loader2,
	Film,
	ListMusic,
	Clock,
	Shuffle,
	GripVertical,
	AlertCircle,
} from "lucide-react";

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotalDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	
	if (h > 0) {
		return `${h}h ${m}m`;
	}
	return `${m} min`;
}

export default function PlaylistDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();

	const { data: playlist, isLoading, error } = trpc.playlist.getById.useQuery({ id });
	const utils = trpc.useUtils();

	const removeVideo = trpc.playlist.removeVideo.useMutation({
		onSuccess: () => {
			utils.playlist.getById.invalidate({ id });
			toast.success("Video removed from playlist");
		},
	});

	const deletePlaylist = trpc.playlist.delete.useMutation({
		onSuccess: () => {
			toast.success("Playlist deleted");
			router.push("/playlists");
		},
	});

	const totalDuration = playlist?.videos.reduce(
		(acc, v) => acc + (v.video.duration ?? 0),
		0
	) ?? 0;

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-10 h-10 animate-spin text-primary" />
			</div>
		);
	}

	if (error || !playlist) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4">
				<AlertCircle className="w-16 h-16 text-destructive" />
				<h1 className="text-2xl font-bold">Playlist Not Found</h1>
				<p className="text-muted-foreground">
					This playlist doesn't exist or you don't have access to it.
				</p>
				<Button asChild>
					<Link href="/playlists">Back to Playlists</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				{/* Back link */}
				<Link
					href="/playlists"
					className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
				>
					<ChevronLeft className="w-4 h-4" />
					Back to Playlists
				</Link>

				{/* Playlist Header */}
				<div className="flex flex-col md:flex-row gap-8 mb-8">
					{/* Thumbnail */}
					<div className="md:w-80 shrink-0">
						<div className="relative aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg">
							{playlist.thumbnailUrl ? (
								<img
									src={playlist.thumbnailUrl}
									alt={playlist.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<div
									className="w-full h-full flex items-center justify-center"
									style={{ backgroundColor: playlist.color ?? "#8B5CF6" }}
								>
									<ListMusic className="w-16 h-16 text-white/80" />
								</div>
							)}
						</div>
					</div>

					{/* Info */}
					<div className="flex-1">
						<div className="flex items-start justify-between gap-4">
							<div>
								<span className="text-xs uppercase tracking-wider text-muted-foreground">
									Playlist
								</span>
								<h1 className="text-3xl md:text-4xl font-bold mt-1">
									{playlist.name}
								</h1>
								{playlist.description && (
									<p className="text-muted-foreground mt-2 max-w-xl">
										{playlist.description}
									</p>
								)}
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon">
										<MoreVertical className="w-5 h-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => {
											if (confirm("Delete this playlist?")) {
												deletePlaylist.mutate({ id });
											}
										}}
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete Playlist
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Stats */}
						<div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<Film className="w-4 h-4" />
								{playlist.videos.length} videos
							</span>
							<span className="flex items-center gap-1.5">
								<Clock className="w-4 h-4" />
								{formatTotalDuration(totalDuration)}
							</span>
						</div>

						{/* Actions */}
						{playlist.videos.length > 0 && (
							<div className="flex items-center gap-3 mt-6">
								<Button asChild size="lg">
									<Link href={`/watch/${playlist.videos[0].video.id}?playlist=${id}`}>
										<Play className="w-5 h-5 mr-2 fill-current" />
										Play All
									</Link>
								</Button>
								<Button variant="secondary" size="lg">
									<Shuffle className="w-5 h-5 mr-2" />
									Shuffle
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Videos List */}
				{playlist.videos.length > 0 ? (
					<div className="space-y-2">
						{playlist.videos.map((item, index) => (
							<div
								key={item.id}
								className="group flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
							>
								{/* Drag handle / index */}
								<div className="w-8 text-center text-muted-foreground">
									<span className="group-hover:hidden">{index + 1}</span>
									<GripVertical className="w-5 h-5 hidden group-hover:block mx-auto cursor-grab" />
								</div>

								{/* Thumbnail */}
								<Link
									href={`/watch/${item.video.id}?playlist=${id}`}
									className="relative w-32 aspect-video rounded-lg overflow-hidden bg-muted shrink-0"
								>
									{item.video.thumbnailUrl ? (
										<img
											src={item.video.thumbnailUrl}
											alt={item.video.title}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Film className="w-6 h-6 text-muted-foreground" />
										</div>
									)}
									{item.video.duration > 0 && (
										<div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-xs">
											{formatDuration(item.video.duration)}
										</div>
									)}
									{/* Play overlay */}
									<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
										<Play className="w-6 h-6 fill-current text-white" />
									</div>
								</Link>

								{/* Info */}
								<div className="flex-1 min-w-0">
									<Link
										href={`/watch/${item.video.id}?playlist=${id}`}
										className="block"
									>
										<h3 className="font-medium truncate group-hover:text-primary transition-colors">
											{item.video.title}
										</h3>
									</Link>
									<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
										{item.video.processingStatus !== "completed" && (
											<span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-500">
												{item.video.processingStatus}
											</span>
										)}
									</div>
								</div>

								{/* Actions */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<MoreVertical className="w-4 h-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem asChild>
											<Link href={`/watch/${item.video.id}`}>
												<Play className="w-4 h-4 mr-2" />
												Play
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={() => {
												removeVideo.mutate({
													playlistId: id,
													videoId: item.video.id,
												});
											}}
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Remove from Playlist
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
					</div>
				) : (
					/* Empty State */
					<div className="text-center py-16">
						<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
							<Film className="w-7 h-7 text-muted-foreground" />
						</div>
						<h3 className="font-semibold mb-1">No videos in this playlist</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Add videos from your library to get started
						</p>
						<Button asChild variant="secondary">
							<Link href="/library">Browse Library</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
