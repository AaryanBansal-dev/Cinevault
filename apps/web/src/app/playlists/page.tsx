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
	ListMusic,
	Play,
	Plus,
	MoreVertical,
	Trash2,
	Edit,
	Lock,
	Globe,
	Loader2,
	X,
	Film,
	ChevronLeft,
} from "lucide-react";

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

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaylistsPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingPlaylist, setEditingPlaylist] = useState<{
		id: string;
		name: string;
		description: string;
		isPublic: boolean;
	} | null>(null);
	const [newPlaylist, setNewPlaylist] = useState({
		name: "",
		description: "",
		isPublic: false,
	});

	const { data: playlists, isLoading } = trpc.playlist.getAll.useQuery();
	const utils = trpc.useUtils();

	const createPlaylist = trpc.playlist.create.useMutation({
		onSuccess: () => {
			utils.playlist.getAll.invalidate();
			setIsCreateOpen(false);
			setNewPlaylist({ name: "", description: "", isPublic: false });
			toast.success("Playlist created");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updatePlaylist = trpc.playlist.update.useMutation({
		onSuccess: () => {
			utils.playlist.getAll.invalidate();
			setEditingPlaylist(null);
			toast.success("Playlist updated");
		},
	});

	const deletePlaylist = trpc.playlist.delete.useMutation({
		onSuccess: () => {
			utils.playlist.getAll.invalidate();
			toast.success("Playlist deleted");
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPlaylist.name.trim()) return;
		createPlaylist.mutate(newPlaylist);
	};

	const handleUpdate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingPlaylist) return;
		updatePlaylist.mutate({
			id: editingPlaylist.id,
			name: editingPlaylist.name,
			description: editingPlaylist.description,
			isPublic: editingPlaylist.isPublic,
		});
	};

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<Link
							href="/library"
							className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
						>
							<ChevronLeft className="w-4 h-4" />
							Back to Library
						</Link>
						<h1 className="text-3xl font-bold">
							My <span className="gradient-text">Playlists</span>
						</h1>
						<p className="text-muted-foreground mt-1">
							{playlists?.length ?? 0} playlists
						</p>
					</div>
					<Button onClick={() => setIsCreateOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Create Playlist
					</Button>
				</div>

				{/* Playlists Grid */}
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : playlists && playlists.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{playlists.map((playlist) => (
							<div
								key={playlist.id}
								className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
							>
								<Link href={`/playlists/${playlist.id}`}>
									{/* Thumbnail */}
									<div className="relative aspect-video bg-muted">
										{playlist.thumbnailUrl ? (
											<img
												src={playlist.thumbnailUrl}
												alt={playlist.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										) : (
											<div
												className="w-full h-full flex items-center justify-center"
												style={{ backgroundColor: playlist.color ?? "#8B5CF6" }}
											>
												<ListMusic className="w-12 h-12 text-white/80" />
											</div>
										)}
										{/* Play button overlay */}
										<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
											<div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
												<Play className="w-5 h-5 fill-current ml-0.5" />
											</div>
										</div>
										{/* Video count badge */}
										<div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs backdrop-blur-sm">
											{playlist.videoCount} videos
										</div>
									</div>

									{/* Info */}
									<div className="p-4">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<h3 className="font-semibold truncate group-hover:text-primary transition-colors">
													{playlist.name}
												</h3>
												{playlist.description && (
													<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
														{playlist.description}
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
											{playlist.isPublic ? (
												<span className="flex items-center gap-1">
													<Globe className="w-3 h-3" />
													Public
												</span>
											) : (
												<span className="flex items-center gap-1">
													<Lock className="w-3 h-3" />
													Private
												</span>
											)}
										</div>
									</div>
								</Link>

								{/* Actions dropdown */}
								<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="secondary"
												size="icon"
												className="h-8 w-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
											>
												<MoreVertical className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault();
													setEditingPlaylist({
														id: playlist.id,
														name: playlist.name,
														description: playlist.description ?? "",
														isPublic: playlist.isPublic,
													});
												}}
											>
												<Edit className="w-4 h-4 mr-2" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onClick={(e) => {
													e.preventDefault();
													if (confirm("Delete this playlist?")) {
														deletePlaylist.mutate({ id: playlist.id });
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
						))}
					</div>
				) : (
					/* Empty State */
					<div className="text-center py-20">
						<div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
							<ListMusic className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
						<p className="text-muted-foreground mb-6">
							Create your first playlist to organize your videos
						</p>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Create Playlist
						</Button>
					</div>
				)}
			</div>

			{/* Create Playlist Modal */}
			<Modal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				title="Create New Playlist"
			>
				<form onSubmit={handleCreate} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name *</Label>
						<Input
							id="name"
							value={newPlaylist.name}
							onChange={(e) =>
								setNewPlaylist((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="My Awesome Playlist"
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<textarea
							id="description"
							value={newPlaylist.description}
							onChange={(e) =>
								setNewPlaylist((prev) => ({ ...prev, description: e.target.value }))
							}
							placeholder="What's this playlist about?"
							className="w-full p-3 rounded-lg bg-input border border-border focus:border-primary outline-none resize-none min-h-20"
							rows={3}
						/>
					</div>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="isPublic"
							checked={newPlaylist.isPublic}
							onChange={(e) =>
								setNewPlaylist((prev) => ({ ...prev, isPublic: e.target.checked }))
							}
							className="rounded border-border"
						/>
						<Label htmlFor="isPublic" className="text-sm font-normal cursor-pointer">
							Make this playlist public
						</Label>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={!newPlaylist.name.trim() || createPlaylist.isPending}>
							{createPlaylist.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* Edit Playlist Modal */}
			<Modal
				isOpen={!!editingPlaylist}
				onClose={() => setEditingPlaylist(null)}
				title="Edit Playlist"
			>
				<form onSubmit={handleUpdate} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-name">Name *</Label>
						<Input
							id="edit-name"
							value={editingPlaylist?.name ?? ""}
							onChange={(e) =>
								setEditingPlaylist((prev) =>
									prev ? { ...prev, name: e.target.value } : null
								)
							}
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-description">Description</Label>
						<textarea
							id="edit-description"
							value={editingPlaylist?.description ?? ""}
							onChange={(e) =>
								setEditingPlaylist((prev) =>
									prev ? { ...prev, description: e.target.value } : null
								)
							}
							className="w-full p-3 rounded-lg bg-input border border-border focus:border-primary outline-none resize-none min-h-20"
							rows={3}
						/>
					</div>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-isPublic"
							checked={editingPlaylist?.isPublic ?? false}
							onChange={(e) =>
								setEditingPlaylist((prev) =>
									prev ? { ...prev, isPublic: e.target.checked } : null
								)
							}
							className="rounded border-border"
						/>
						<Label htmlFor="edit-isPublic" className="text-sm font-normal cursor-pointer">
							Make this playlist public
						</Label>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={() => setEditingPlaylist(null)}>
							Cancel
						</Button>
						<Button type="submit" disabled={updatePlaylist.isPending}>
							{updatePlaylist.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
