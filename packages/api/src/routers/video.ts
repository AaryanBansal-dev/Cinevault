import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, video, watchHistory, userSettings } from "@Cinevault/db";
import { eq, desc, and, sql, like, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const videoRouter = router({
    // Get all videos for the current user
    getAll: protectedProcedure
        .input(
            z.object({
                folderId: z.string().optional(),
                search: z.string().optional(),
                sortBy: z.enum(["newest", "oldest", "name", "size"]).default("newest"),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { folderId, search, sortBy = "newest", limit = 50 } = input ?? {};

            const conditions = [eq(video.ownerId, userId)];

            if (folderId) {
                conditions.push(eq(video.folderId, folderId));
            }

            if (search) {
                conditions.push(like(video.title, `%${search}%`));
            }

            const orderBy = {
                newest: desc(video.createdAt),
                oldest: asc(video.createdAt),
                name: asc(video.title),
                size: desc(video.fileSize),
            }[sortBy];

            const videos = await db
                .select()
                .from(video)
                .where(and(...conditions))
                .orderBy(orderBy)
                .limit(limit);

            return videos;
        }),

    // Get a single video by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const [result] = await db
                .select()
                .from(video)
                .where(and(eq(video.id, input.id), eq(video.ownerId, userId)))
                .limit(1);

            return result ?? null;
        }),

    // Get videos with watch progress (continue watching)
    getContinueWatching: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const results = await db
            .select({
                video: video,
                progress: watchHistory.progressPercent,
                watchedAt: watchHistory.watchedAt,
            })
            .from(watchHistory)
            .innerJoin(video, eq(watchHistory.videoId, video.id))
            .where(
                and(
                    eq(watchHistory.userId, userId),
                    eq(watchHistory.completed, false),
                    sql`${watchHistory.progressPercent} > 0`
                )
            )
            .orderBy(desc(watchHistory.watchedAt))
            .limit(10);

        return results;
    }),

    // Get recent uploads
    getRecent: protectedProcedure
        .input(z.object({ limit: z.number().min(1).max(20).default(6) }).optional())
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const limit = input?.limit ?? 6;

            const videos = await db
                .select()
                .from(video)
                .where(eq(video.ownerId, userId))
                .orderBy(desc(video.createdAt))
                .limit(limit);

            return videos;
        }),

    // Get videos in same folder
    getRelated: protectedProcedure
        .input(z.object({ videoId: z.string(), limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get the current video to find its folder
            const [currentVideo] = await db
                .select()
                .from(video)
                .where(and(eq(video.id, input.videoId), eq(video.ownerId, userId)))
                .limit(1);

            if (!currentVideo) return [];

            // Get other videos in the same folder
            const conditions = [
                eq(video.ownerId, userId),
                sql`${video.id} != ${input.videoId}`,
            ];

            if (currentVideo.folderId) {
                conditions.push(eq(video.folderId, currentVideo.folderId));
            }

            const videos = await db
                .select()
                .from(video)
                .where(and(...conditions))
                .orderBy(desc(video.createdAt))
                .limit(input.limit);

            return videos;
        }),

    // Create a new video record
    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().max(5000).optional(),
                folderId: z.string().optional(),
                originalFilename: z.string().optional(),
                fileSize: z.number().optional(),
                mimeType: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const id = nanoid();

            const [newVideo] = await db
                .insert(video)
                .values({
                    id,
                    ownerId: userId,
                    title: input.title,
                    description: input.description,
                    folderId: input.folderId,
                    originalFilename: input.originalFilename,
                    fileSize: input.fileSize ?? 0,
                    mimeType: input.mimeType,
                    processingStatus: "pending",
                })
                .returning();

            return newVideo;
        }),

    // Update video metadata
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1).max(200).optional(),
                description: z.string().max(5000).optional(),
                folderId: z.string().nullable().optional(),
                thumbnailUrl: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { id, ...updates } = input;

            const [updated] = await db
                .update(video)
                .set(updates)
                .where(and(eq(video.id, id), eq(video.ownerId, userId)))
                .returning();

            return updated;
        }),

    // Update processing status (for upload completion)
    updateProcessingStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                status: z.enum(["pending", "uploading", "processing", "completed", "failed"]),
                progress: z.number().min(0).max(100).optional(),
                error: z.string().optional(),
                streamUrl: z.string().optional(),
                thumbnailUrl: z.string().optional(),
                duration: z.number().optional(),
                width: z.number().optional(),
                height: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { id, status, progress, error, ...media } = input;

            const [updated] = await db
                .update(video)
                .set({
                    processingStatus: status,
                    processingProgress: progress,
                    processingError: error,
                    ...media,
                })
                .where(and(eq(video.id, id), eq(video.ownerId, userId)))
                .returning();

            return updated;
        }),

    // Delete a video
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Get video to check ownership and get file size for storage update
            const [videoToDelete] = await db
                .select()
                .from(video)
                .where(and(eq(video.id, input.id), eq(video.ownerId, userId)))
                .limit(1);

            if (!videoToDelete) {
                throw new Error("Video not found");
            }

            // Delete the video
            await db
                .delete(video)
                .where(and(eq(video.id, input.id), eq(video.ownerId, userId)));

            // Update storage used
            await db
                .update(userSettings)
                .set({
                    storageUsed: sql`GREATEST(0, ${userSettings.storageUsed} - ${videoToDelete.fileSize})`,
                })
                .where(eq(userSettings.userId, userId));

            return { success: true };
        }),

    // Update watch progress
    updateProgress: protectedProcedure
        .input(
            z.object({
                videoId: z.string(),
                progressSeconds: z.number().min(0),
                progressPercent: z.number().min(0).max(100),
                completed: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const id = nanoid();

            // Upsert watch history
            await db
                .insert(watchHistory)
                .values({
                    id,
                    userId,
                    videoId: input.videoId,
                    progressSeconds: input.progressSeconds,
                    progressPercent: input.progressPercent,
                    completed: input.completed ?? input.progressPercent >= 95,
                })
                .onConflictDoUpdate({
                    target: [watchHistory.userId, watchHistory.videoId],
                    set: {
                        progressSeconds: input.progressSeconds,
                        progressPercent: input.progressPercent,
                        completed: input.completed ?? input.progressPercent >= 95,
                        watchedAt: new Date(),
                    },
                });

            // Increment view count if this is a new watch
            await db
                .update(video)
                .set({ viewCount: sql`${video.viewCount} + 1` })
                .where(eq(video.id, input.videoId));

            return { success: true };
        }),

    // Get library stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Get total videos and storage
        const [stats] = await db
            .select({
                totalVideos: sql<number>`COUNT(*)::int`,
                totalStorage: sql<number>`COALESCE(SUM(${video.fileSize}), 0)::bigint`,
                totalDuration: sql<number>`COALESCE(SUM(${video.duration}), 0)::int`,
            })
            .from(video)
            .where(eq(video.ownerId, userId));

        // Get videos uploaded this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [monthStats] = await db
            .select({
                count: sql<number>`COUNT(*)::int`,
            })
            .from(video)
            .where(
                and(
                    eq(video.ownerId, userId),
                    sql`${video.createdAt} >= ${startOfMonth}`
                )
            );

        return {
            totalVideos: stats?.totalVideos ?? 0,
            totalStorage: Number(stats?.totalStorage ?? 0),
            totalDuration: stats?.totalDuration ?? 0,
            thisMonth: monthStats?.count ?? 0,
        };
    }),
});
