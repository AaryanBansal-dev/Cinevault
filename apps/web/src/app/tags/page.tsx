"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
	Tag,
	Plus,
	ChevronLeft,
	Loader2,
	X,
	Edit,
	Trash2,
	Film,
	Hash,
} from "lucide-react";

const TAG_COLORS = [
	"#EF4444", // red
	"#F97316", // orange
	"#EAB308", // yellow
	"#22C55E", // green
	"#06B6D4", // cyan
	"#3B82F6", // blue
	"#6366F1", // indigo
	"#8B5CF6", // violet
	"#EC4899", // pink
	"#64748B", // slate
];

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

export default function TagsPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingTag, setEditingTag] = useState<{
		id: string;
		name: string;
		color: string;
	} | null>(null);
	const [newTag, setNewTag] = useState({
		name: "",
		color: "#6366F1",
	});

	const { data: tags, isLoading } = trpc.tag.getAll.useQuery();
	const utils = trpc.useUtils();

	const createTag = trpc.tag.create.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			setIsCreateOpen(false);
			setNewTag({ name: "", color: "#6366F1" });
			toast.success("Tag created");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateTag = trpc.tag.update.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			setEditingTag(null);
			toast.success("Tag updated");
		},
	});

	const deleteTag = trpc.tag.delete.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			toast.success("Tag deleted");
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTag.name.trim()) return;
		createTag.mutate(newTag);
	};

	const handleUpdate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTag) return;
		updateTag.mutate(editingTag);
	};

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8 max-w-4xl">
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
							<span className="gradient-text">Tags</span>
						</h1>
						<p className="text-muted-foreground mt-1">
							Organize your videos with custom tags
						</p>
					</div>
					<Button onClick={() => setIsCreateOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Create Tag
					</Button>
				</div>

				{/* Tags Grid */}
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : tags && tags.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{tags.map((tag) => (
							<div
								key={tag.id}
								className="group relative p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
							>
								<div className="flex items-center gap-3">
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
										style={{ backgroundColor: `${tag.color}20` }}
									>
										<Hash
											className="w-5 h-5"
											style={{ color: tag.color ?? undefined }}
										/>
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold truncate">{tag.name}</h3>
										<p className="text-sm text-muted-foreground">
											{tag.videoCount} videos
										</p>
									</div>
								</div>

								{/* Actions */}
								<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() =>
											setEditingTag({
												id: tag.id,
												name: tag.name,
												color: tag.color ?? "#6366F1",
											})
										}
									>
										<Edit className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive"
										onClick={() => {
											if (confirm("Delete this tag?")) {
												deleteTag.mutate({ id: tag.id });
											}
										}}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>

								{/* Click to view videos */}
								{tag.videoCount > 0 && (
									<Link
										href={`/library?tag=${tag.id}`}
										className="absolute inset-0"
									/>
								)}
							</div>
						))}
					</div>
				) : (
					/* Empty State */
					<div className="text-center py-20">
						<div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
							<Tag className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold mb-2">No tags yet</h3>
						<p className="text-muted-foreground mb-6">
							Create tags to organize your videos
						</p>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Create Your First Tag
						</Button>
					</div>
				)}
			</div>

			{/* Create Tag Modal */}
			<Modal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				title="Create New Tag"
			>
				<form onSubmit={handleCreate} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name *</Label>
						<Input
							id="name"
							value={newTag.name}
							onChange={(e) =>
								setNewTag((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="e.g. Favorites, Work, Personal"
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label>Color</Label>
						<div className="flex flex-wrap gap-2">
							{TAG_COLORS.map((color) => (
								<button
									key={color}
									type="button"
									onClick={() => setNewTag((prev) => ({ ...prev, color }))}
									className={`w-8 h-8 rounded-full transition-all ${
										newTag.color === color
											? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
											: "hover:scale-110"
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setIsCreateOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!newTag.name.trim() || createTag.isPending}
						>
							{createTag.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"Create"
							)}
						</Button>
					</div>
				</form>
			</Modal>

			{/* Edit Tag Modal */}
			<Modal
				isOpen={!!editingTag}
				onClose={() => setEditingTag(null)}
				title="Edit Tag"
			>
				<form onSubmit={handleUpdate} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-name">Name *</Label>
						<Input
							id="edit-name"
							value={editingTag?.name ?? ""}
							onChange={(e) =>
								setEditingTag((prev) =>
									prev ? { ...prev, name: e.target.value } : null
								)
							}
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label>Color</Label>
						<div className="flex flex-wrap gap-2">
							{TAG_COLORS.map((color) => (
								<button
									key={color}
									type="button"
									onClick={() =>
										setEditingTag((prev) =>
											prev ? { ...prev, color } : null
										)
									}
									className={`w-8 h-8 rounded-full transition-all ${
										editingTag?.color === color
											? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
											: "hover:scale-110"
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setEditingTag(null)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={updateTag.isPending}>
							{updateTag.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"Save"
							)}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
