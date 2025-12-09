"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import {
	Heart,
	Play,
	ChevronLeft,
	Loader2,
	Film,
	Clock,
	Eye,
} from "lucide-react";
import { LikeButton } from "@/components/like-button";

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date: Date | string): string {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FavoritesPage() {
	const { data: likes, isLoading } = trpc.likes.getAll.useQuery();

	const totalDuration = likes?.reduce((acc, l) => acc + (l.video.duration ?? 0), 0) ?? 0;

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				{/* Header */}
				<div className="mb-8">
					<Link
						href="/library"
						className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
					>
						<ChevronLeft className="w-4 h-4" />
						Back to Library
					</Link>
					<div className="flex items-center gap-4">
						<div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
							<Heart className="w-7 h-7 fill-current text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">
								Liked <span className="gradient-text">Videos</span>
							</h1>
							<p className="text-muted-foreground mt-1">
								{likes?.length ?? 0} videos • {Math.floor(totalDuration / 60)} minutes
							</p>
						</div>
					</div>
				</div>

				{/* Videos List */}
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : likes && likes.length > 0 ? (
					<div className="space-y-3">
						{likes.map((like, index) => (
							<div
								key={like.likeId}
								className="group flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
							>
								{/* Index */}
								<div className="w-8 text-center text-muted-foreground text-sm">
									{index + 1}
								</div>

								{/* Thumbnail */}
								<Link
									href={`/watch/${like.video.id}`}
									className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted shrink-0"
								>
									{like.video.thumbnailUrl ? (
										<img
											src={like.video.thumbnailUrl}
											alt={like.video.title}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Film className="w-6 h-6 text-muted-foreground" />
										</div>
									)}
									{like.video.duration > 0 && (
										<div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-xs">
											{formatDuration(like.video.duration)}
										</div>
									)}
									{/* Play overlay */}
									<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
										<Play className="w-8 h-8 fill-current text-white" />
									</div>
								</Link>

								{/* Info */}
								<div className="flex-1 min-w-0">
									<Link href={`/watch/${like.video.id}`}>
										<h3 className="font-medium truncate group-hover:text-primary transition-colors">
											{like.video.title}
										</h3>
									</Link>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
										<span className="flex items-center gap-1">
											<Eye className="w-3 h-3" />
											{like.video.viewCount} views
										</span>
										<span className="flex items-center gap-1">
											<Clock className="w-3 h-3" />
											Liked {formatDate(like.likedAt)}
										</span>
									</div>
								</div>

								{/* Like Button */}
								<LikeButton videoId={like.video.id} variant="icon" size="md" />
							</div>
						))}
					</div>
				) : (
					/* Empty State */
					<div className="text-center py-20">
						<div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
							<Heart className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold mb-2">No liked videos yet</h3>
						<p className="text-muted-foreground mb-6">
							Videos you like will appear here
						</p>
						<Button asChild>
							<Link href="/library">Browse Library</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
