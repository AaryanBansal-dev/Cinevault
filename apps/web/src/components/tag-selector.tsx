"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tag,
	Plus,
	X,
	Check,
	Loader2,
	Hash,
} from "lucide-react";

interface TagSelectorProps {
	videoId: string;
	compact?: boolean;
	className?: string;
}

export function TagSelector({ videoId, compact = false, className }: TagSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [createMode, setCreateMode] = useState(false);
	const [newTagName, setNewTagName] = useState("");

	const { data: allTags } = trpc.tag.getAll.useQuery();
	const { data: videoTags, isLoading } = trpc.tag.getForVideo.useQuery({ videoId });
	const utils = trpc.useUtils();

	const createTag = trpc.tag.create.useMutation({
		onSuccess: async (tag) => {
			// Add the newly created tag to the video
			await addTag.mutateAsync({ tagId: tag.id, videoId });
			utils.tag.getAll.invalidate();
			setCreateMode(false);
			setNewTagName("");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const addTag = trpc.tag.addToVideo.useMutation({
		onSuccess: () => {
			utils.tag.getForVideo.invalidate({ videoId });
		},
	});

	const removeTag = trpc.tag.removeFromVideo.useMutation({
		onSuccess: () => {
			utils.tag.getForVideo.invalidate({ videoId });
		},
	});

	const videoTagIds = new Set(videoTags?.map((t) => t.id) ?? []);

	const handleToggleTag = (tagId: string) => {
		if (videoTagIds.has(tagId)) {
			removeTag.mutate({ tagId, videoId });
		} else {
			addTag.mutate({ tagId, videoId });
		}
	};

	const handleCreateTag = () => {
		if (!newTagName.trim()) return;
		createTag.mutate({ name: newTagName });
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={compact ? "ghost" : "secondary"}
					size={compact ? "icon" : "default"}
					className={className}
				>
					{compact ? (
						<Tag className="w-5 h-5" />
					) : (
						<>
							<Tag className="w-4 h-4 mr-2" />
							Tags
							{videoTags && videoTags.length > 0 && (
								<span className="ml-2 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs">
									{videoTags.length}
								</span>
							)}
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-64 p-3">
				{/* Current tags */}
				{videoTags && videoTags.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-border">
						{videoTags.map((tag) => (
							<span
								key={tag.id}
								className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
								style={{
									backgroundColor: `${tag.color}20`,
									color: tag.color ?? undefined,
								}}
							>
								<Hash className="w-3 h-3" />
								{tag.name}
								<button
									onClick={() => removeTag.mutate({ tagId: tag.id, videoId })}
									className="hover:bg-black/10 rounded-full p-0.5"
								>
									<X className="w-3 h-3" />
								</button>
							</span>
						))}
					</div>
				)}

				{/* Create new tag */}
				{createMode ? (
					<div className="flex gap-2 mb-3">
						<Input
							value={newTagName}
							onChange={(e) => setNewTagName(e.target.value)}
							placeholder="Tag name"
							className="h-8 text-sm"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreateTag();
								if (e.key === "Escape") setCreateMode(false);
							}}
						/>
						<Button
							size="sm"
							className="h-8 px-2"
							disabled={!newTagName.trim() || createTag.isPending}
							onClick={handleCreateTag}
						>
							{createTag.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Check className="w-4 h-4" />
							)}
						</Button>
					</div>
				) : (
					<button
						onClick={() => setCreateMode(true)}
						className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors mb-2"
					>
						<Plus className="w-4 h-4" />
						Create new tag
					</button>
				)}

				{/* Available tags */}
				{allTags && allTags.length > 0 ? (
					<div className="max-h-48 overflow-y-auto -mx-1">
						{allTags
							.filter((tag) => !videoTagIds.has(tag.id))
							.map((tag) => (
								<button
									key={tag.id}
									onClick={() => handleToggleTag(tag.id)}
									disabled={addTag.isPending || removeTag.isPending}
									className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
								>
									<Hash
										className="w-4 h-4"
										style={{ color: tag.color ?? undefined }}
									/>
									<span className="flex-1 text-left truncate">{tag.name}</span>
									<span className="text-xs text-muted-foreground">
										{tag.videoCount}
									</span>
								</button>
							))}
					</div>
				) : isLoading ? (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
					</div>
				) : (
					<p className="text-sm text-muted-foreground text-center py-4">
						No tags yet
					</p>
				)}
			</PopoverContent>
		</Popover>
	);
}
