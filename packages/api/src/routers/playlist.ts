import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, playlist, playlistVideo, video } from "@Cinevault/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const playlistRouter = router({
    // Get all playlists for current user
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const playlists = await db
            .select({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                isPublic: playlist.isPublic,
                thumbnailUrl: playlist.thumbnailUrl,
                color: playlist.color,
                createdAt: playlist.createdAt,
                updatedAt: playlist.updatedAt,
            })
            .from(playlist)
            .where(eq(playlist.ownerId, ctx.session.user.id))
            .orderBy(desc(playlist.updatedAt));

        // Get video counts for each playlist
        const playlistsWithCounts = await Promise.all(
            playlists.map(async (p) => {
                const videos = await db
                    .select({ id: playlistVideo.id })
                    .from(playlistVideo)
                    .where(eq(playlistVideo.playlistId, p.id));

                return {
                    ...p,
                    videoCount: videos.length,
                };
            })
        );

        return playlistsWithCounts;
    }),

    // Get single playlist with videos
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const [p] = await db
                .select()
                .from(playlist)
                .where(
                    and(
                        eq(playlist.id, input.id),
                        eq(playlist.ownerId, ctx.session.user.id)
                    )
                );

            if (!p) {
                throw new Error("Playlist not found");
            }

            // Get videos in playlist
            const playlistVideos = await db
                .select({
                    id: playlistVideo.id,
                    position: playlistVideo.position,
                    addedAt: playlistVideo.addedAt,
                    video: {
                        id: video.id,
                        title: video.title,
                        duration: video.duration,
                        thumbnailUrl: video.thumbnailUrl,
                        fileSize: video.fileSize,
                        processingStatus: video.processingStatus,
                    },
                })
                .from(playlistVideo)
                .innerJoin(video, eq(playlistVideo.videoId, video.id))
                .where(eq(playlistVideo.playlistId, input.id))
                .orderBy(asc(playlistVideo.position));

            return {
                ...p,
                videos: playlistVideos,
            };
        }),

    // Create playlist
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                description: z.string().max(500).optional(),
                isPublic: z.boolean().default(false),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const id = nanoid();

            await db.insert(playlist).values({
                id,
                ownerId: ctx.session.user.id,
                name: input.name,
                description: input.description,
                isPublic: input.isPublic,
                color: input.color,
            });

            return { id, ...input };
        }),

    // Update playlist
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                description: z.string().max(500).optional(),
                isPublic: z.boolean().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...updates } = input;

            await db
                .update(playlist)
                .set(updates)
                .where(
                    and(
                        eq(playlist.id, id),
                        eq(playlist.ownerId, ctx.session.user.id)
                    )
                );

            return { success: true };
        }),

    // Delete playlist
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await db
                .delete(playlist)
                .where(
                    and(
                        eq(playlist.id, input.id),
                        eq(playlist.ownerId, ctx.session.user.id)
                    )
                );

            return { success: true };
        }),

    // Add video to playlist
    addVideo: protectedProcedure
        .input(
            z.object({
                playlistId: z.string(),
                videoId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify playlist ownership
            const [p] = await db
                .select({ id: playlist.id })
                .from(playlist)
                .where(
                    and(
                        eq(playlist.id, input.playlistId),
                        eq(playlist.ownerId, ctx.session.user.id)
                    )
                );

            if (!p) {
                throw new Error("Playlist not found");
            }

            // Check if video is already in playlist
            const existing = await db
                .select({ id: playlistVideo.id })
                .from(playlistVideo)
                .where(
                    and(
                        eq(playlistVideo.playlistId, input.playlistId),
                        eq(playlistVideo.videoId, input.videoId)
                    )
                );

            if (existing.length > 0) {
                throw new Error("Video already in playlist");
            }

            // Get max position
            const videos = await db
                .select({ position: playlistVideo.position })
                .from(playlistVideo)
                .where(eq(playlistVideo.playlistId, input.playlistId))
                .orderBy(desc(playlistVideo.position))
                .limit(1);

            const nextPosition = videos.length > 0 ? videos[0].position + 1 : 0;

            const id = nanoid();
            await db.insert(playlistVideo).values({
                id,
                playlistId: input.playlistId,
                videoId: input.videoId,
                position: nextPosition,
            });

            // Update playlist thumbnail if it doesn't have one
            const [playlistData] = await db
                .select({ thumbnailUrl: playlist.thumbnailUrl })
                .from(playlist)
                .where(eq(playlist.id, input.playlistId));

            if (!playlistData?.thumbnailUrl) {
                const [videoData] = await db
                    .select({ thumbnailUrl: video.thumbnailUrl })
                    .from(video)
                    .where(eq(video.id, input.videoId));

                if (videoData?.thumbnailUrl) {
                    await db
                        .update(playlist)
                        .set({ thumbnailUrl: videoData.thumbnailUrl })
                        .where(eq(playlist.id, input.playlistId));
                }
            }

            return { success: true };
        }),

    // Remove video from playlist
    removeVideo: protectedProcedure
        .input(
            z.object({
                playlistId: z.string(),
                videoId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify playlist ownership
            const [p] = await db
                .select({ id: playlist.id })
                .from(playlist)
                .where(
                    and(
                        eq(playlist.id, input.playlistId),
                        eq(playlist.ownerId, ctx.session.user.id)
                    )
                );

            if (!p) {
                throw new Error("Playlist not found");
            }

            await db
                .delete(playlistVideo)
                .where(
                    and(
                        eq(playlistVideo.playlistId, input.playlistId),
                        eq(playlistVideo.videoId, input.videoId)
                    )
                );

            return { success: true };
        }),

    // Reorder videos in playlist
    reorderVideos: protectedProcedure
        .input(
            z.object({
                playlistId: z.string(),
                videoIds: z.array(z.string()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Verify playlist ownership
            const [p] = await db
                .select({ id: playlist.id })
                .from(playlist)
                .where(
                    and(
                        eq(playlist.id, input.playlistId),
                        eq(playlist.ownerId, ctx.session.user.id)
                    )
                );

            if (!p) {
                throw new Error("Playlist not found");
            }

            // Update positions
            await Promise.all(
                input.videoIds.map(async (videoId, index) => {
                    await db
                        .update(playlistVideo)
                        .set({ position: index })
                        .where(
                            and(
                                eq(playlistVideo.playlistId, input.playlistId),
                                eq(playlistVideo.videoId, videoId)
                            )
                        );
                })
            );

            return { success: true };
        }),
});
