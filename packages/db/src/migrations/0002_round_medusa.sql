CREATE TYPE "public"."activity_type" AS ENUM('video_upload', 'video_watch', 'video_like', 'video_delete', 'playlist_create', 'playlist_add_video', 'folder_create', 'tag_create', 'settings_update');--> statement-breakpoint
CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "activity_type" NOT NULL,
	"resource_id" text,
	"resource_type" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"thumbnail_url" text,
	"color" text DEFAULT '#8B5CF6',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_video" (
	"id" text PRIMARY KEY NOT NULL,
	"playlist_id" text NOT NULL,
	"video_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366F1',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_like" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"video_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_video" ADD CONSTRAINT "playlist_video_playlist_id_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_video" ADD CONSTRAINT "playlist_video_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_like" ADD CONSTRAINT "video_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_like" ADD CONSTRAINT "video_like_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tag" ADD CONSTRAINT "video_tag_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tag" ADD CONSTRAINT "video_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_type_idx" ON "activity" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "playlist_owner_idx" ON "playlist" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "playlist_video_playlist_idx" ON "playlist_video" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "playlist_video_video_idx" ON "playlist_video" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "tag_owner_idx" ON "tag" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "video_like_user_idx" ON "video_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "video_like_video_idx" ON "video_like" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_tag_video_idx" ON "video_tag" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_tag_tag_idx" ON "video_tag" USING btree ("tag_id");