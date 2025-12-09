"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
	Clock,
	Folder,
	Play,
	MoreVertical,
	Trash2,
	Search,
	Grid3X3,
	List,
	SortDesc,
	Upload,
	Film,
	Edit,
	Download,
	Eye,
	Calendar,
	HardDrive,
	FolderPlus,
	LayoutGrid,
	Loader2,
	X,
	Pencil,
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

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(date: Date | string): string {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelativeTime(date: Date | string): string {
	const d = new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 60) return `${diffMins} minutes ago`;
	if (diffHours < 24) return `${diffHours} hours ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	return formatDate(date);
}

// Simple Modal Component
function Modal({
	isOpen,
	onClose,
	title,
	children,
}: {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}) {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
			<div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl m-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">{title}</h3>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="w-4 h-4" />
					</Button>
				</div>
				{children}
			</div>
		</div>
	);
}

export default function LibraryPage() {
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "size">("newest");
	const [searchQuery, setSearchQuery] = useState("");

	// Modal states
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
	const [newFolderName, setNewFolderName] = useState("");

	// Fetch data from API
	const { data: videos, isLoading: videosLoading } = trpc.video.getAll.useQuery({
		folderId: selectedFolder ?? undefined,
		search: searchQuery || undefined,
		sortBy,
	});

	const { data: folders, isLoading: foldersLoading } = trpc.folder.getAll.useQuery();
	const { data: stats } = trpc.video.getStats.useQuery();
	const { data: continueWatching } = trpc.video.getContinueWatching.useQuery();

	const utils = trpc.useUtils();

	// Mutations
	const createFolder = trpc.folder.create.useMutation({
		onSuccess: () => {
			utils.folder.getAll.invalidate();
			setIsCreateFolderOpen(false);
			setNewFolderName("");
			toast.success("Folder created");
		},
	});

	const updateFolder = trpc.folder.update.useMutation({
		onSuccess: () => {
			utils.folder.getAll.invalidate();
			setEditingFolder(null);
			toast.success("Folder updated");
		},
	});

	const deleteFolder = trpc.folder.delete.useMutation({
		onSuccess: () => {
			utils.folder.getAll.invalidate();
			if (selectedFolder === deleteFolder.variables?.id) {
				setSelectedFolder(null);
			}
			toast.success("Folder deleted");
		},
	});

	const deleteVideo = trpc.video.delete.useMutation({
		onSuccess: () => {
			utils.video.getAll.invalidate();
			utils.video.getStats.invalidate();
			toast.success("Video deleted");
		},
	});

	const handleCreateFolder = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newFolderName.trim()) return;
		createFolder.mutate({ name: newFolderName });
	};

	const handleUpdateFolder = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingFolder || !editingFolder.name.trim()) return;
		updateFolder.mutate({ id: editingFolder.id, name: editingFolder.name });
	};

	const totalStorageGB = stats ? stats.totalStorage / (1024 * 1024 * 1024) : 0;

	return (
		<div className="min-h-screen">
			<div className="flex">
				{/* Sidebar - Folders */}
				<aside className="hidden md:block w-64 border-r border-border p-4 min-h-[calc(100vh-4rem)]">
					<div className="sticky top-20">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-semibold">Folders</h2>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsCreateFolderOpen(true)}
								title="Create Folder"
							>
								<FolderPlus className="w-4 h-4" />
							</Button>
						</div>

						<nav className="space-y-1">
							{/* All Videos */}
							<button
								onClick={() => setSelectedFolder(null)}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
									selectedFolder === null
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
							>
								<LayoutGrid className="w-4 h-4" />
								<span className="flex-1 text-left">All Videos</span>
								<span className="text-xs opacity-60">{stats?.totalVideos ?? 0}</span>
							</button>

							{/* Dynamic Folders */}
							{foldersLoading ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
								</div>
							) : (
								folders?.map((folder) => (
									<div
										key={folder.id}
										className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
											selectedFolder === folder.id
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:bg-muted hover:text-foreground"
										}`}
									>
										<button
											onClick={() => setSelectedFolder(folder.id)}
											className="flex-1 flex items-center gap-3 min-w-0"
										>
											<Folder className="w-4 h-4 shrink-0" style={{ color: folder.color ?? undefined }} />
											<span className="truncate">{folder.name}</span>
										</button>
										<span className="text-xs opacity-60">{folder.videoCount}</span>
										
										{/* Folder Actions */}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<MoreVertical className="w-3 h-3" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}>
													<Pencil className="w-4 h-4 mr-2" />
													Rename
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-destructive focus:text-destructive"
													onClick={() => {
														if (confirm("Delete this folder? Videos inside will not be deleted.")) {
															deleteFolder.mutate({ id: folder.id });
														}
													}}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								))
							)}
						</nav>

						{/* Storage Info */}
						<div className="mt-8 p-4 rounded-xl bg-card border border-border">
							<div className="flex items-center gap-2 mb-3">
								<HardDrive className="w-4 h-4 text-muted-foreground" />
								<span className="text-sm font-medium">Storage Used</span>
							</div>
							<p className="text-2xl font-bold">{totalStorageGB.toFixed(1)} GB</p>
							<div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-primary to-accent"
									style={{ width: `${Math.min(totalStorageGB, 100)}%` }}
								/>
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								{stats?.totalVideos ?? 0} videos in your library
							</p>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 p-4 md:p-8">
					{/* Header */}
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold">
								{selectedFolder === null ? (
									<>My <span className="gradient-text">Library</span></>
								) : (
									folders?.find((f) => f.id === selectedFolder)?.name ?? "Folder"
								)}
							</h1>
							<p className="text-muted-foreground text-sm mt-1">
								{videos?.length ?? 0} videos
							</p>
						</div>
						<Button asChild>
							<Link href="/upload">
								<Upload className="w-4 h-4 mr-2" />
								Upload Video
							</Link>
						</Button>
					</div>

					{/* Continue Watching */}
					{selectedFolder === null && continueWatching && continueWatching.length > 0 && (
						<section className="mb-8">
							<div className="flex items-center gap-2 mb-4">
								<Clock className="w-5 h-5 text-primary" />
								<h2 className="font-semibold">Continue Watching</h2>
							</div>
							<div className="flex gap-4 overflow-x-auto pb-2 content-row">
								{continueWatching.map(({ video: v, progress, watchedAt }) => (
									<Link
										key={v.id}
										href={`/watch/${v.id}`}
										className="group flex-shrink-0 w-64"
									>
										<div className="relative rounded-xl overflow-hidden video-card">
											<div className="aspect-video bg-muted">
												{v.thumbnailUrl ? (
													<img
														src={v.thumbnailUrl}
														alt={v.title}
														className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Film className="w-8 h-8 text-muted-foreground" />
													</div>
												)}
											</div>
											{/* Progress bar */}
											<div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
												<div
													className="h-full bg-primary"
													style={{ width: `${progress}%` }}
												/>
											</div>
											<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
												<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center play-pulse">
													<Play className="w-5 h-5 fill-current ml-0.5" />
												</div>
											</div>
										</div>
										<div className="mt-2">
											<h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
												{v.title}
											</h3>
											<p className="text-xs text-muted-foreground">
												{progress}% • {formatRelativeTime(watchedAt)}
											</p>
										</div>
									</Link>
								))}
							</div>
						</section>
					)}

					{/* Search & Filters */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search your videos..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border focus:border-primary outline-none"
							/>
						</div>
						<div className="flex gap-2">
							<div className="flex items-center gap-2">
								<SortDesc className="w-4 h-4 text-muted-foreground" />
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
									className="px-3 py-2 rounded-lg bg-card border border-border outline-none text-sm"
								>
									<option value="newest">Newest</option>
									<option value="oldest">Oldest</option>
									<option value="name">Name</option>
									<option value="size">Size</option>
								</select>
							</div>
							<div className="flex rounded-lg overflow-hidden border border-border">
								<button
									onClick={() => setViewMode("grid")}
									className={`p-2 transition-colors ${
										viewMode === "grid"
											? "bg-primary text-primary-foreground"
											: "bg-card hover:bg-muted"
									}`}
								>
									<Grid3X3 className="w-5 h-5" />
								</button>
								<button
									onClick={() => setViewMode("list")}
									className={`p-2 transition-colors ${
										viewMode === "list"
											? "bg-primary text-primary-foreground"
											: "bg-card hover:bg-muted"
									}`}
								>
									<List className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>

					{/* Mobile Folder Selector */}
					<div className="md:hidden mb-6">
						<select
							value={selectedFolder ?? ""}
							onChange={(e) => setSelectedFolder(e.target.value || null)}
							className="w-full px-4 py-2 rounded-lg bg-card border border-border outline-none"
						>
							<option value="">All Videos ({stats?.totalVideos ?? 0})</option>
							{folders?.map((folder) => (
								<option key={folder.id} value={folder.id}>
									{folder.name} ({folder.videoCount})
								</option>
							))}
						</select>
					</div>

					{/* Loading State */}
					{videosLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : videos && videos.length > 0 ? (
						/* Videos Grid/List */
						<div
							className={
								viewMode === "grid"
									? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
									: "flex flex-col gap-4"
							}
						>
							{videos.map((video, index) => (
								<div
									key={video.id}
									className={`group animate-fade-in ${
										viewMode === "list"
											? "flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
											: ""
									}`}
									style={{ animationDelay: `${index * 0.05}s` }}
								>
									{/* Thumbnail */}
									<Link
										href={`/watch/${video.id}`}
										className={`block relative overflow-hidden rounded-xl video-card ${
											viewMode === "list" ? "w-48 shrink-0" : ""
										}`}
									>
										<div className="aspect-video bg-muted">
											{video.thumbnailUrl ? (
												<img
													src={video.thumbnailUrl}
													alt={video.title}
													className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<Film className="w-8 h-8 text-muted-foreground" />
												</div>
											)}
										</div>
										<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
											<div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm play-pulse">
												<Play className="w-5 h-5 fill-current ml-0.5" />
											</div>
										</div>
										{video.duration > 0 && (
											<div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs backdrop-blur-sm">
												{formatDuration(video.duration)}
											</div>
										)}
										{video.processingStatus !== "completed" && (
											<div className="absolute top-2 left-2 px-2 py-1 rounded bg-orange-500/90 text-xs text-white">
												{video.processingStatus}
											</div>
										)}
									</Link>

									{/* Info */}
									<div className={viewMode === "grid" ? "mt-3" : "flex-1 min-w-0"}>
										<div className="flex items-start justify-between gap-2">
											<Link href={`/watch/${video.id}`} className="flex-1 min-w-0">
												<h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
													{video.title}
												</h3>
											</Link>
											<div className="relative group/menu">
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
															<Link href={`/watch/${video.id}`}>
																<Play className="w-4 h-4 mr-2" />
																Play
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={() => {
																if (confirm("Delete this video?")) {
																	deleteVideo.mutate({ id: video.id });
																}
															}}
														>
															<Trash2 className="w-4 h-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
											{video.folderId && (
												<>
													<span className="flex items-center gap-1">
														<Folder className="w-3 h-3" />
														{folders?.find((f) => f.id === video.folderId)?.name ?? "Folder"}
													</span>
													<span>•</span>
												</>
											)}
											<span>{formatFileSize(video.fileSize)}</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
											<span className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												{formatDate(video.createdAt)}
											</span>
											{video.viewCount > 0 && (
												<>
													<span>•</span>
													<span className="flex items-center gap-1">
														<Eye className="w-3 h-3" />
														{video.viewCount} views
													</span>
												</>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						/* Empty State */
						<div className="text-center py-20">
							<div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
								<Film className="w-8 h-8 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold mb-2">No videos found</h3>
							<p className="text-muted-foreground mb-6">
								{searchQuery
									? "Try adjusting your search"
									: "Upload your first video to get started"}
							</p>
							<Button asChild>
								<Link href="/upload">
									<Upload className="w-4 h-4 mr-2" />
									Upload Video
								</Link>
							</Button>
						</div>
					)}
				</main>
			</div>

			{/* Create Folder Modal */}
			<Modal
				isOpen={isCreateFolderOpen}
				onClose={() => setIsCreateFolderOpen(false)}
				title="Create New Folder"
			>
				<form onSubmit={handleCreateFolder} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="folder-name">Folder Name</Label>
						<Input
							id="folder-name"
							value={newFolderName}
							onChange={(e) => setNewFolderName(e.target.value)}
							placeholder="e.g., Movies, Family, Work"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="ghost" onClick={() => setIsCreateFolderOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={!newFolderName.trim() || createFolder.isPending}>
							{createFolder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* Edit Folder Modal */}
			<Modal
				isOpen={!!editingFolder}
				onClose={() => setEditingFolder(null)}
				title="Rename Folder"
			>
				<form onSubmit={handleUpdateFolder} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-folder-name">Folder Name</Label>
						<Input
							id="edit-folder-name"
							value={editingFolder?.name ?? ""}
							onChange={(e) =>
								setEditingFolder((prev) => (prev ? { ...prev, name: e.target.value } : null))
							}
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="ghost" onClick={() => setEditingFolder(null)}>
							Cancel
						</Button>
						<Button type="submit" disabled={!editingFolder?.name.trim() || updateFolder.isPending}>
							{updateFolder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
