import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, folder } from "@Cinevault/db";
import { eq, and, sql, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const folderRouter = router({
    // Get all folders for the current user
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const folders = await db
            .select({
                folder: folder,
                videoCount: sql<number>`(
					SELECT COUNT(*) FROM video WHERE video.folder_id = ${folder.id}
				)::int`,
            })
            .from(folder)
            .where(eq(folder.ownerId, userId))
            .orderBy(asc(folder.name));

        return folders.map((f) => ({
            ...f.folder,
            videoCount: f.videoCount,
        }));
    }),

    // Get folder by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const [result] = await db
                .select()
                .from(folder)
                .where(and(eq(folder.id, input.id), eq(folder.ownerId, userId)))
                .limit(1);

            return result ?? null;
        }),

    // Create a new folder
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                parentId: z.string().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const id = nanoid();

            const [newFolder] = await db
                .insert(folder)
                .values({
                    id,
                    ownerId: userId,
                    name: input.name,
                    parentId: input.parentId,
                    color: input.color,
                })
                .returning();

            return newFolder;
        }),

    // Update a folder
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                parentId: z.string().nullable().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            const { id, ...updates } = input;

            const [updated] = await db
                .update(folder)
                .set(updates)
                .where(and(eq(folder.id, id), eq(folder.ownerId, userId)))
                .returning();

            return updated;
        }),

    // Delete a folder (videos will have folderId set to null)
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            await db
                .delete(folder)
                .where(and(eq(folder.id, input.id), eq(folder.ownerId, userId)));

            return { success: true };
        }),
});
