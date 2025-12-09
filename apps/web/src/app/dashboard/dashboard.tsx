"use client";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Play,
	Upload,
	Clock,
	ChevronRight,
	HardDrive,
	Film,
	Folder,
	Calendar,
	TrendingUp,
	Loader2,
} from "lucide-react";

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	
	if (h > 0) {
		return `${h}h ${m}m`;
	}
	return `${m}m`;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatRelativeTime(date: Date | string): string {
	const d = new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 60) return `${diffMins} min ago`;
	if (diffHours < 24) return `${diffHours} hours ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	return d.toLocaleDateString();
}

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const firstName = session.user.name?.split(" ")[0] || "User";
	const timeOfDay = new Date().getHours();
	const greeting =
		timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening";

	// Fetch data from API
	const { data: stats, isLoading: statsLoading } = trpc.video.getStats.useQuery();
	const { data: continueWatching, isLoading: cwLoading } = trpc.video.getContinueWatching.useQuery();
	const { data: recentVideos, isLoading: recentLoading } = trpc.video.getRecent.useQuery({ limit: 6 });

	const totalStorageGB = stats ? stats.totalStorage / (1024 * 1024 * 1024) : 0;
	const totalWatchHours = stats ? Math.floor(stats.totalDuration / 3600) : 0;

	return (
		<div className="space-y-8 p-4 md:p-8">
			{/* Welcome Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold">
						{greeting}, <span className="gradient-text">{firstName}</span>!
					</h1>
					<p className="text-muted-foreground mt-1">
						Welcome to your personal media library
					</p>
				</div>
				<Button asChild>
					<Link href="/upload">
						<Upload className="w-4 h-4 mr-2" />
						Upload Video
					</Link>
				</Button>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="p-4 rounded-2xl bg-card border border-border">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-lg bg-primary/10">
							<Film className="w-4 h-4 text-primary" />
						</div>
						<span className="text-sm text-muted-foreground">Total Videos</span>
					</div>
					{statsLoading ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<p className="text-2xl font-bold">{stats?.totalVideos ?? 0}</p>
					)}
				</div>
				<div className="p-4 rounded-2xl bg-card border border-border">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-lg bg-accent/10">
							<HardDrive className="w-4 h-4 text-accent" />
						</div>
						<span className="text-sm text-muted-foreground">Storage Used</span>
					</div>
					{statsLoading ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<p className="text-2xl font-bold">{totalStorageGB.toFixed(1)} GB</p>
					)}
				</div>
				<div className="p-4 rounded-2xl bg-card border border-border">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-lg bg-green-500/10">
							<Clock className="w-4 h-4 text-green-500" />
						</div>
						<span className="text-sm text-muted-foreground">Total Duration</span>
					</div>
					{statsLoading ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<p className="text-2xl font-bold">{totalWatchHours}h</p>
					)}
				</div>
				<div className="p-4 rounded-2xl bg-card border border-border">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-lg bg-orange-500/10">
							<TrendingUp className="w-4 h-4 text-orange-500" />
						</div>
						<span className="text-sm text-muted-foreground">This Month</span>
					</div>
					{statsLoading ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<p className="text-2xl font-bold">+{stats?.thisMonth ?? 0}</p>
					)}
				</div>
			</div>

			{/* Continue Watching */}
			{!cwLoading && continueWatching && continueWatching.length > 0 && (
				<section>
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Clock className="w-5 h-5 text-primary" />
							<h2 className="text-xl font-semibold">Continue Watching</h2>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{continueWatching.map(({ video, progress, watchedAt }) => (
							<Link
								key={video.id}
								href={`/watch/${video.id}`}
								className="group flex gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
							>
								<div className="relative w-32 shrink-0">
									<div className="aspect-video rounded-lg overflow-hidden bg-muted">
										{video.thumbnailUrl ? (
											<img
												src={video.thumbnailUrl}
												alt={video.title}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<Film className="w-6 h-6 text-muted-foreground" />
											</div>
										)}
									</div>
									{/* Progress bar */}
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
										<div
											className="h-full bg-primary"
											style={{ width: `${progress}%` }}
										/>
									</div>
									{/* Play overlay */}
									<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
										<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
											<Play className="w-4 h-4 fill-current ml-0.5" />
										</div>
									</div>
								</div>
								<div className="flex-1 min-w-0 py-1">
									<h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
										{video.title}
									</h3>
									<p className="text-xs text-muted-foreground mt-1">
										{progress}% completed
									</p>
									<p className="text-xs text-muted-foreground">
										{formatRelativeTime(watchedAt)}
									</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Recent Uploads */}
			<section>
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Calendar className="w-5 h-5 text-primary" />
						<h2 className="text-xl font-semibold">Recent Uploads</h2>
					</div>
					<Link
						href="/library"
						className="text-sm text-primary hover:underline flex items-center gap-1"
					>
						View All <ChevronRight className="w-4 h-4" />
					</Link>
				</div>

				{recentLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : recentVideos && recentVideos.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{recentVideos.map((video) => (
							<Link
								key={video.id}
								href={`/watch/${video.id}`}
								className="group"
							>
								<div className="relative overflow-hidden rounded-xl bg-muted">
									<div className="aspect-video">
										{video.thumbnailUrl ? (
											<img
												src={video.thumbnailUrl}
												alt={video.title}
												className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<Film className="w-10 h-10 text-muted-foreground" />
											</div>
										)}
									</div>
									<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
											<Play className="w-5 h-5 fill-current ml-0.5" />
										</div>
									</div>
									{video.duration > 0 && (
										<div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs backdrop-blur-sm">
											{formatDuration(video.duration)}
										</div>
									)}
								</div>
								<div className="mt-2">
									<h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
										{video.title}
									</h3>
									<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
										<span>{formatRelativeTime(video.createdAt)}</span>
										<span>•</span>
										<span>{formatFileSize(video.fileSize)}</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="text-center py-12 bg-card rounded-xl border border-border">
						<Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="font-medium mb-2">No videos yet</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Upload your first video to get started
						</p>
						<Button asChild>
							<Link href="/upload">
								<Upload className="w-4 h-4 mr-2" />
								Upload Video
							</Link>
						</Button>
					</div>
				)}
			</section>

			{/* Quick Actions */}
			<section className="grid sm:grid-cols-2 gap-4">
				<Link
					href="/upload"
					className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group"
				>
					<div className="flex items-center gap-4">
						<div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
							<Upload className="w-6 h-6 text-primary" />
						</div>
						<div>
							<h3 className="font-semibold">Upload Video</h3>
							<p className="text-sm text-muted-foreground">
								Add new videos to your library
							</p>
						</div>
						<ChevronRight className="w-5 h-5 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
					</div>
				</Link>

				<Link
					href="/library"
					className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all group"
				>
					<div className="flex items-center gap-4">
						<div className="p-3 rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors">
							<Folder className="w-6 h-6 text-accent" />
						</div>
						<div>
							<h3 className="font-semibold">Browse Library</h3>
							<p className="text-sm text-muted-foreground">
								Organize and manage your videos
							</p>
						</div>
						<ChevronRight className="w-5 h-5 ml-auto text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
					</div>
				</Link>
			</section>
		</div>
	);
}
