import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, tag, videoTag, video } from "@Cinevault/db";
import { eq, and, desc, ilike } from "drizzle-orm";
import { nanoid } from "nanoid";

export const tagRouter = router({
    // Get all tags for current user
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const tags = await db
            .select({
                id: tag.id,
                name: tag.name,
                color: tag.color,
                createdAt: tag.createdAt,
            })
            .from(tag)
            .where(eq(tag.ownerId, ctx.session.user.id))
            .orderBy(tag.name);

        // Get video counts for each tag
        const tagsWithCounts = await Promise.all(
            tags.map(async (t) => {
                const videos = await db
                    .select({ id: videoTag.id })
                    .from(videoTag)
                    .where(eq(videoTag.tagId, t.id));

                return {
                    ...t,
                    videoCount: videos.length,
                };
            })
        );

        return tagsWithCounts;
    }),

    // Create tag
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(50),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Check if tag already exists
            const existing = await db
                .select({ id: tag.id })
                .from(tag)
                .where(
                    and(
                        eq(tag.ownerId, ctx.session.user.id),
                        ilike(tag.name, input.name)
                    )
                );

            if (existing.length > 0) {
                throw new Error("Tag already exists");
            }

            const id = nanoid();
            await db.insert(tag).values({
                id,
                ownerId: ctx.session.user.id,
                name: input.name,
                color: input.color ?? "#6366F1",
            });

            return { id, ...input };
        }),

    // Update tag
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(50).optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            await db
                .update(tag)
                .set(updates)
                .where(
                    and(
                        eq(tag.id, id),
                        eq(tag.ownerId, ctx.session.user.id)
                    )
                );

            return { success: true };
        }),

    // Delete tag
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await db
                .delete(tag)
                .where(
                    and(
                        eq(tag.id, input.id),
                        eq(tag.ownerId, ctx.session.user.id)
                    )
                );

            return { success: true };
        }),

    // Add tag to video
    addToVideo: protectedProcedure
        .input(
            z.object({
                tagId: z.string(),
                videoId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify tag ownership
            const [t] = await db
                .select({ id: tag.id })
                .from(tag)
                .where(
                    and(
                        eq(tag.id, input.tagId),
                        eq(tag.ownerId, ctx.session.user.id)
                    )
                );

            if (!t) {
                throw new Error("Tag not found");
            }

            // Check if already tagged
            const existing = await db
                .select({ id: videoTag.id })
                .from(videoTag)
                .where(
                    and(
                        eq(videoTag.videoId, input.videoId),
                        eq(videoTag.tagId, input.tagId)
                    )
                );

            if (existing.length > 0) {
                return { success: true, alreadyExists: true };
            }

            const id = nanoid();
            await db.insert(videoTag).values({
                id,
                videoId: input.videoId,
                tagId: input.tagId,
            });

            return { success: true };
        }),

    // Remove tag from video
    removeFromVideo: protectedProcedure
        .input(
            z.object({
                tagId: z.string(),
                videoId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await db
                .delete(videoTag)
                .where(
                    and(
                        eq(videoTag.videoId, input.videoId),
                        eq(videoTag.tagId, input.tagId)
                    )
                );

            return { success: true };
        }),

    // Get tags for a video
    getForVideo: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .query(async ({ ctx, input }) => {
            const tags = await db
                .select({
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                })
                .from(videoTag)
                .innerJoin(tag, eq(videoTag.tagId, tag.id))
                .where(eq(videoTag.videoId, input.videoId));

            return tags;
        }),

    // Get videos with a specific tag
    getVideos: protectedProcedure
        .input(z.object({ tagId: z.string() }))
        .query(async ({ ctx, input }) => {
            const videos = await db
                .select({
                    id: video.id,
                    title: video.title,
                    duration: video.duration,
                    thumbnailUrl: video.thumbnailUrl,
                    fileSize: video.fileSize,
                    createdAt: video.createdAt,
                    processingStatus: video.processingStatus,
                })
                .from(videoTag)
                .innerJoin(video, eq(videoTag.videoId, video.id))
                .where(eq(videoTag.tagId, input.tagId))
                .orderBy(desc(video.createdAt));

            return videos;
        }),
});
