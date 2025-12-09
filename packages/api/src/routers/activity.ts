import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, activity, video } from "@Cinevault/db";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const activityRouter = router({
    // Get recent activity for current user
    getRecent: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(20),
                offset: z.number().default(0),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? 20;
            const offset = input?.offset ?? 0;

            const activities = await db
                .select()
                .from(activity)
                .where(eq(activity.userId, ctx.session.user.id))
                .orderBy(desc(activity.createdAt))
                .limit(limit)
                .offset(offset);

            // Enrich with resource details
            const enrichedActivities = await Promise.all(
                activities.map(async (act) => {
                    let resourceDetails: { title?: string; thumbnailUrl?: string | null } = {};

                    // Fetch resource details based on type
                    if (act.resourceType === "video" && act.resourceId) {
                        const [v] = await db
                            .select({ title: video.title, thumbnailUrl: video.thumbnailUrl })
                            .from(video)
                            .where(eq(video.id, act.resourceId))
                            .limit(1);
                        if (v) resourceDetails = v;
                    }

                    return {
                        ...act,
                        resourceDetails,
                    };
                })
            );

            return enrichedActivities;
        }),

    // Log an activity
    log: protectedProcedure
        .input(
            z.object({
                type: z.enum([
                    "video_upload",
                    "video_watch",
                    "video_like",
                    "video_delete",
                    "playlist_create",
                    "playlist_add_video",
                    "folder_create",
                    "tag_create",
                    "settings_update",
                ]),
                resourceId: z.string().optional(),
                resourceType: z.string().optional(),
                metadata: z.record(z.any()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const id = nanoid();

            await db.insert(activity).values({
                id,
                userId: ctx.session.user.id,
                type: input.type,
                resourceId: input.resourceId,
                resourceType: input.resourceType,
                metadata: input.metadata,
            });

            return { success: true };
        }),

    // Get activity stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const activities = await db
            .select()
            .from(activity)
            .where(eq(activity.userId, ctx.session.user.id));

        // Calculate stats by type
        const stats: Record<string, number> = {};
        activities.forEach((act) => {
            stats[act.type] = (stats[act.type] || 0) + 1;
        });

        return {
            totalActivities: activities.length,
            byType: stats,
        };
    }),

    // Clear activity history
    clear: protectedProcedure.mutation(async ({ ctx }) => {
        await db
            .delete(activity)
            .where(eq(activity.userId, ctx.session.user.id));

        return { success: true };
    }),
});
