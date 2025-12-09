ALTER TABLE "video" ADD COLUMN "bitrate" integer;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "aspect_ratio" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "audio_codec" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "audio_channels" integer;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "audio_sample_rate" integer;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "audio_bitrate" integer;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "altitude" real;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "camera_model" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "camera_make" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "software" text;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "recorded_at" timestamp;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "raw_metadata" jsonb;