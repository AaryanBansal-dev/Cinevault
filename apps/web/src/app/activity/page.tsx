"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import {
	Activity,
	ChevronLeft,
	Loader2,
	Upload,
	Play,
	Heart,
	Trash2,
	ListMusic,
	Folder,
	Tag,
	Settings,
	Film,
	Clock,
} from "lucide-react";
import { toast } from "sonner";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
	video_upload: <Upload className="w-4 h-4" />,
	video_watch: <Play className="w-4 h-4" />,
	video_like: <Heart className="w-4 h-4" />,
	video_delete: <Trash2 className="w-4 h-4" />,
	playlist_create: <ListMusic className="w-4 h-4" />,
	playlist_add_video: <ListMusic className="w-4 h-4" />,
	folder_create: <Folder className="w-4 h-4" />,
	tag_create: <Tag className="w-4 h-4" />,
	settings_update: <Settings className="w-4 h-4" />,
};

const ACTIVITY_LABELS: Record<string, string> = {
	video_upload: "Uploaded a video",
	video_watch: "Watched a video",
	video_like: "Liked a video",
	video_delete: "Deleted a video",
	playlist_create: "Created a playlist",
	playlist_add_video: "Added video to playlist",
	folder_create: "Created a folder",
	tag_create: "Created a tag",
	settings_update: "Updated settings",
};

const ACTIVITY_COLORS: Record<string, string> = {
	video_upload: "bg-blue-500/20 text-blue-500",
	video_watch: "bg-green-500/20 text-green-500",
	video_like: "bg-red-500/20 text-red-500",
	video_delete: "bg-orange-500/20 text-orange-500",
	playlist_create: "bg-purple-500/20 text-purple-500",
	playlist_add_video: "bg-purple-500/20 text-purple-500",
	folder_create: "bg-yellow-500/20 text-yellow-500",
	tag_create: "bg-indigo-500/20 text-indigo-500",
	settings_update: "bg-slate-500/20 text-slate-500",
};

function formatRelativeTime(date: Date | string): string {
	const d = new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	return d.toLocaleDateString();
}

export default function ActivityPage() {
	const { data: activities, isLoading } = trpc.activity.getRecent.useQuery({
		limit: 50,
	});
	const { data: stats } = trpc.activity.getStats.useQuery();
	const utils = trpc.useUtils();

	const clearActivity = trpc.activity.clear.useMutation({
		onSuccess: () => {
			utils.activity.getRecent.invalidate();
			utils.activity.getStats.invalidate();
			toast.success("Activity cleared");
		},
	});

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<Link
							href="/dashboard"
							className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
						>
							<ChevronLeft className="w-4 h-4" />
							Back to Dashboard
						</Link>
						<h1 className="text-3xl font-bold">
							<span className="gradient-text">Activity</span>
						</h1>
						<p className="text-muted-foreground mt-1">
							Your recent actions and history
						</p>
					</div>
					{activities && activities.length > 0 && (
						<Button
							variant="outline"
							onClick={() => {
								if (confirm("Clear all activity history?")) {
									clearActivity.mutate();
								}
							}}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Clear History
						</Button>
					)}
				</div>

				{/* Stats */}
				{stats && stats.totalActivities > 0 && (
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
						<div className="p-4 rounded-xl bg-card border border-border">
							<p className="text-2xl font-bold">{stats.totalActivities}</p>
							<p className="text-sm text-muted-foreground">Total Actions</p>
						</div>
						<div className="p-4 rounded-xl bg-card border border-border">
							<p className="text-2xl font-bold">{stats.byType.video_upload ?? 0}</p>
							<p className="text-sm text-muted-foreground">Uploads</p>
						</div>
						<div className="p-4 rounded-xl bg-card border border-border">
							<p className="text-2xl font-bold">{stats.byType.video_watch ?? 0}</p>
							<p className="text-sm text-muted-foreground">Videos Watched</p>
						</div>
						<div className="p-4 rounded-xl bg-card border border-border">
							<p className="text-2xl font-bold">{stats.byType.video_like ?? 0}</p>
							<p className="text-sm text-muted-foreground">Likes</p>
						</div>
					</div>
				)}

				{/* Activity List */}
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : activities && activities.length > 0 ? (
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

						<div className="space-y-4">
							{activities.map((act) => (
								<div
									key={act.id}
									className="relative flex gap-4 pl-12"
								>
									{/* Icon */}
									<div
										className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center ${
											ACTIVITY_COLORS[act.type] ?? "bg-muted"
										}`}
									>
										{ACTIVITY_ICONS[act.type] ?? <Activity className="w-4 h-4" />}
									</div>

									{/* Content */}
									<div className="flex-1 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<p className="font-medium">
													{ACTIVITY_LABELS[act.type] ?? act.type}
												</p>
												{act.resourceDetails?.title && (
													<Link
														href={
															act.resourceType === "video" && act.resourceId
																? `/watch/${act.resourceId}`
																: "#"
														}
														className="text-sm text-primary hover:underline truncate block"
													>
														{act.resourceDetails.title}
													</Link>
												)}
											</div>
											<span className="text-xs text-muted-foreground whitespace-nowrap">
												{formatRelativeTime(act.createdAt)}
											</span>
										</div>

										{/* Thumbnail */}
										{act.resourceDetails?.thumbnailUrl && (
											<Link
												href={
													act.resourceType === "video" && act.resourceId
														? `/watch/${act.resourceId}`
														: "#"
												}
												className="mt-3 block"
											>
												<div className="w-32 aspect-video rounded-lg overflow-hidden bg-muted">
													<img
														src={act.resourceDetails.thumbnailUrl}
														alt=""
														className="w-full h-full object-cover"
													/>
												</div>
											</Link>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					/* Empty State */
					<div className="text-center py-20">
						<div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
							<Clock className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold mb-2">No activity yet</h3>
						<p className="text-muted-foreground mb-6">
							Your actions will appear here as you use CineVault
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
