import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, userSettings, video } from "@Cinevault/db";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const settingsRouter = router({
    // Get user settings (create if doesn't exist)
    get: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        let [settings] = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        // Create default settings if not exists
        if (!settings) {
            [settings] = await db
                .insert(userSettings)
                .values({
                    id: nanoid(),
                    userId,
                })
                .returning();
        }

        // Calculate actual storage used
        const [storageStats] = await db
            .select({
                used: sql<number>`COALESCE(SUM(${video.fileSize}), 0)::bigint`,
            })
            .from(video)
            .where(eq(video.ownerId, userId));

        return {
            ...settings,
            storageUsed: Number(storageStats?.used ?? 0),
        };
    }),

    // Update user settings
    update: protectedProcedure
        .input(
            z.object({
                autoplay: z.boolean().optional(),
                defaultQuality: z.string().optional(),
                theme: z.enum(["dark", "light", "system"]).optional(),
                emailNotifications: z.boolean().optional(),
                uploadNotifications: z.boolean().optional(),
                storageWarnings: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Ensure settings exist
            const [existing] = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, userId))
                .limit(1);

            if (!existing) {
                const [created] = await db
                    .insert(userSettings)
                    .values({
                        id: nanoid(),
                        userId,
                        ...input,
                    })
                    .returning();
                return created;
            }

            const [updated] = await db
                .update(userSettings)
                .set(input)
                .where(eq(userSettings.userId, userId))
                .returning();

            return updated;
        }),

    // Get storage breakdown
    getStorageBreakdown: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const [settings] = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        const [storageStats] = await db
            .select({
                videoStorage: sql<number>`COALESCE(SUM(${video.fileSize}), 0)::bigint`,
                videoCount: sql<number>`COUNT(*)::int`,
            })
            .from(video)
            .where(eq(video.ownerId, userId));

        return {
            storageLimit: settings?.storageLimit ?? 107374182400, // 100GB
            videos: Number(storageStats?.videoStorage ?? 0),
            thumbnails: Math.round(Number(storageStats?.videoStorage ?? 0) * 0.01), // Estimate 1%
            transcoded: Math.round(Number(storageStats?.videoStorage ?? 0) * 0.3), // Estimate 30%
            total:
                Number(storageStats?.videoStorage ?? 0) +
                Math.round(Number(storageStats?.videoStorage ?? 0) * 0.31),
            videoCount: storageStats?.videoCount ?? 0,
        };
    }),
});
