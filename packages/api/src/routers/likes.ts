import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, videoLike, video } from "@Cinevault/db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const likesRouter = router({
    // Check if video is liked
    isLiked: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .query(async ({ ctx, input }) => {
            const [like] = await db
                .select({ id: videoLike.id })
                .from(videoLike)
                .where(
                    and(
                        eq(videoLike.userId, ctx.session.user.id),
                        eq(videoLike.videoId, input.videoId)
                    )
                );

            return { isLiked: !!like };
        }),

    // Toggle like on video
    toggle: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Check if already liked
            const [existing] = await db
                .select({ id: videoLike.id })
                .from(videoLike)
                .where(
                    and(
                        eq(videoLike.userId, ctx.session.user.id),
                        eq(videoLike.videoId, input.videoId)
                    )
                );

            if (existing) {
                // Unlike
                await db
                    .delete(videoLike)
                    .where(eq(videoLike.id, existing.id));

                return { isLiked: false };
            } else {
                // Like
                const id = nanoid();
                await db.insert(videoLike).values({
                    id,
                    userId: ctx.session.user.id,
                    videoId: input.videoId,
                });

                return { isLiked: true };
            }
        }),

    // Get all liked videos
    getAll: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                offset: z.number().default(0),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? 50;
            const offset = input?.offset ?? 0;

            const likes = await db
                .select({
                    likeId: videoLike.id,
                    likedAt: videoLike.createdAt,
                    video: {
                        id: video.id,
                        title: video.title,
                        duration: video.duration,
                        thumbnailUrl: video.thumbnailUrl,
                        fileSize: video.fileSize,
                        createdAt: video.createdAt,
                        processingStatus: video.processingStatus,
                        viewCount: video.viewCount,
                    },
                })
                .from(videoLike)
                .innerJoin(video, eq(videoLike.videoId, video.id))
                .where(eq(videoLike.userId, ctx.session.user.id))
                .orderBy(desc(videoLike.createdAt))
                .limit(limit)
                .offset(offset);

            return likes;
        }),

    // Get like count for a video
    getCount: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .query(async ({ input }) => {
            const likes = await db
                .select({ id: videoLike.id })
                .from(videoLike)
                .where(eq(videoLike.videoId, input.videoId));

            return { count: likes.length };
        }),
});
