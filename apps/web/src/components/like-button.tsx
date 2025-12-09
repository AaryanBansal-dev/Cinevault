"use client";

import { trpc } from "@/utils/trpc";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
	videoId: string;
	variant?: "icon" | "full";
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function LikeButton({
	videoId,
	variant = "icon",
	size = "md",
	className,
}: LikeButtonProps) {
	const { data: likeData, isLoading } = trpc.likes.isLiked.useQuery({ videoId });
	const utils = trpc.useUtils();

	const toggleLike = trpc.likes.toggle.useMutation({
		onMutate: async () => {
			// Optimistic update
			await utils.likes.isLiked.cancel({ videoId });
			const previousData = utils.likes.isLiked.getData({ videoId });
			utils.likes.isLiked.setData({ videoId }, (old) => ({
				isLiked: !old?.isLiked,
			}));
			return { previousData };
		},
		onError: (err, _, context) => {
			// Rollback on error
			if (context?.previousData) {
				utils.likes.isLiked.setData({ videoId }, context.previousData);
			}
			toast.error("Failed to update like");
		},
		onSettled: () => {
			utils.likes.isLiked.invalidate({ videoId });
			utils.likes.getAll.invalidate();
		},
	});

	const isLiked = likeData?.isLiked ?? false;

	const sizeClasses = {
		sm: variant === "icon" ? "h-8 w-8" : "h-8 px-3 text-xs",
		md: variant === "icon" ? "h-9 w-9" : "h-9 px-4 text-sm",
		lg: variant === "icon" ? "h-10 w-10" : "h-10 px-5 text-base",
	};

	const iconSizes = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
	};

	if (variant === "icon") {
		return (
			<Button
				variant="ghost"
				size="icon"
				onClick={() => toggleLike.mutate({ videoId })}
				disabled={isLoading || toggleLike.isPending}
				className={cn(
					sizeClasses[size],
					"transition-all",
					isLiked && "text-red-500 hover:text-red-600",
					className
				)}
				title={isLiked ? "Unlike" : "Like"}
			>
				<Heart
					className={cn(
						iconSizes[size],
						"transition-all",
						isLiked && "fill-current"
					)}
				/>
			</Button>
		);
	}

	return (
		<Button
			variant={isLiked ? "default" : "secondary"}
			onClick={() => toggleLike.mutate({ videoId })}
			disabled={isLoading || toggleLike.isPending}
			className={cn(
				sizeClasses[size],
				isLiked && "bg-red-500 hover:bg-red-600 text-white",
				className
			)}
		>
			<Heart
				className={cn(
					iconSizes[size],
					"mr-2 transition-all",
					isLiked && "fill-current"
				)}
			/>
			{isLiked ? "Liked" : "Like"}
		</Button>
	);
}
