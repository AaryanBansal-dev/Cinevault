import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    real,
    jsonb,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Enums
export const processingStatusEnum = pgEnum("processing_status", [
    "pending",
    "uploading",
    "processing",
    "completed",
    "failed",
]);

// ============================================
// FOLDERS (for organizing videos)
// ============================================
export const folder = pgTable(
    "folder",
    {
        id: text("id").primaryKey(),
        ownerId: text("owner_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        parentId: text("parent_id"), // For nested folders
        color: text("color").default("#8B5CF6"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("folder_owner_idx").on(table.ownerId),
        index("folder_parent_idx").on(table.parentId),
    ],
);

// ============================================
// VIDEOS (User's personal videos)
// ============================================
export const video = pgTable(
    "video",
    {
        id: text("id").primaryKey(),
        ownerId: text("owner_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        folderId: text("folder_id").references(() => folder.id, { onDelete: "set null" }),

        // Content Info
        title: text("title").notNull(),
        description: text("description"),

        // Storage
        originalFilename: text("original_filename"),
        fileSize: integer("file_size").default(0).notNull(), // bytes
        storagePath: text("storage_path"),

        // Streaming URLs
        streamUrl: text("stream_url"),
        hlsManifestUrl: text("hls_manifest_url"),

        // Thumbnail
        thumbnailUrl: text("thumbnail_url"),

        // Video Metadata
        duration: integer("duration").default(0).notNull(), // seconds
        width: integer("width"),
        height: integer("height"),
        frameRate: real("frame_rate"),
        codec: text("codec"),
        mimeType: text("mime_type"),
        bitrate: integer("bitrate"), // bits per second
        aspectRatio: text("aspect_ratio"), // e.g., "16:9"

        // Audio Metadata
        audioCodec: text("audio_codec"),
        audioChannels: integer("audio_channels"),
        audioSampleRate: integer("audio_sample_rate"), // Hz
        audioBitrate: integer("audio_bitrate"), // bits per second

        // GPS/Location Metadata
        latitude: real("latitude"),
        longitude: real("longitude"),
        altitude: real("altitude"), // meters
        locationName: text("location_name"), // Reverse geocoded location

        // Camera/Device Metadata
        cameraModel: text("camera_model"),
        cameraMake: text("camera_make"),
        software: text("software"), // Recording software

        // Date/Time Metadata
        recordedAt: timestamp("recorded_at"), // When video was originally recorded

        // Extended Metadata (stores all extracted metadata as JSON)
        rawMetadata: jsonb("raw_metadata"),

        // Processing
        processingStatus: processingStatusEnum("processing_status")
            .default("pending")
            .notNull(),
        processingProgress: integer("processing_progress").default(0).notNull(),
        processingError: text("processing_error"),

        // Stats
        viewCount: integer("view_count").default(0).notNull(),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("video_owner_idx").on(table.ownerId),
        index("video_folder_idx").on(table.folderId),
        index("video_created_idx").on(table.createdAt),
    ],
);

// ============================================
// WATCH HISTORY (with progress tracking)
// ============================================
export const watchHistory = pgTable(
    "watch_history",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        videoId: text("video_id")
            .notNull()
            .references(() => video.id, { onDelete: "cascade" }),
        watchedAt: timestamp("watched_at").defaultNow().notNull(),
        progressSeconds: integer("progress_seconds").default(0).notNull(),
        progressPercent: integer("progress_percent").default(0).notNull(),
        completed: boolean("completed").default(false).notNull(),
    },
    (table) => [
        index("watch_history_user_idx").on(table.userId),
        index("watch_history_video_idx").on(table.videoId),
        index("watch_history_watched_idx").on(table.watchedAt),
    ],
);

// ============================================
// USER SETTINGS
// ============================================
export const userSettings = pgTable("user_settings", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: "cascade" }),
    storageUsed: integer("storage_used").default(0).notNull(), // bytes
    storageLimit: integer("storage_limit").default(107374182400).notNull(), // 100GB default
    autoplay: boolean("autoplay").default(true).notNull(),
    defaultQuality: text("default_quality").default("auto"),
    theme: text("theme").default("dark"),
    emailNotifications: boolean("email_notifications").default(true).notNull(),
    uploadNotifications: boolean("upload_notifications").default(true).notNull(),
    storageWarnings: boolean("storage_warnings").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

// ============================================
// RELATIONS
// ============================================
export const folderRelations = relations(folder, ({ one, many }) => ({
    owner: one(user, {
        fields: [folder.ownerId],
        references: [user.id],
    }),
    parent: one(folder, {
        fields: [folder.parentId],
        references: [folder.id],
        relationName: "folderHierarchy",
    }),
    children: many(folder, { relationName: "folderHierarchy" }),
    videos: many(video),
}));

export const videoRelations = relations(video, ({ one, many }) => ({
    owner: one(user, {
        fields: [video.ownerId],
        references: [user.id],
    }),
    folder: one(folder, {
        fields: [video.folderId],
        references: [folder.id],
    }),
    watchHistory: many(watchHistory),
}));

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
    user: one(user, {
        fields: [watchHistory.userId],
        references: [user.id],
    }),
    video: one(video, {
        fields: [watchHistory.videoId],
        references: [video.id],
    }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(user, {
        fields: [userSettings.userId],
        references: [user.id],
    }),
}));
