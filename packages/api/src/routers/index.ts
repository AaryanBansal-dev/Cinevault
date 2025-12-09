import { protectedProcedure, publicProcedure, router } from "../index";
import { videoRouter } from "./video";
import { folderRouter } from "./folder";
import { settingsRouter } from "./settings";

export const appRouter = router({
	// Health check
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),

	// Protected test route
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),

	// Feature routers
	video: videoRouter,
	folder: folderRouter,
	settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
