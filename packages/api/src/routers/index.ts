import { protectedProcedure, publicProcedure, router } from "../index";
import { videoRouter } from "./video";
import { folderRouter } from "./folder";
import { settingsRouter } from "./settings";
import { playlistRouter } from "./playlist";
import { tagRouter } from "./tag";
import { likesRouter } from "./likes";
import { activityRouter } from "./activity";

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
	playlist: playlistRouter,
	tag: tagRouter,
	likes: likesRouter,
	activity: activityRouter,
});

export type AppRouter = typeof appRouter;


