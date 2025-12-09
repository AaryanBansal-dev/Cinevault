import { NextRequest, NextResponse } from "next/server";
import { auth } from "@Cinevault/auth";
import { db, video, eq, and } from "@Cinevault/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { extractVideoMetadata, reverseGeocode } from "@/lib/metadata-extractor";

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse FormData
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const videoId = formData.get("videoId") as string | null;

        if (!file || !videoId) {
            return NextResponse.json(
                { error: "Missing file or videoId" },
                { status: 400 },
            );
        }

        // 3. Verify video ownership
        const [existingVideo] = await db
            .select()
            .from(video)
            .where(and(eq(video.id, videoId), eq(video.ownerId, session.user.id)))
            .limit(1);

        if (!existingVideo) {
            return NextResponse.json(
                { error: "Video not found or unauthorized" },
                { status: 404 },
            );
        }

        // 4. Save file to videos folder
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name) || ".mp4";
        const filename = `${videoId}${ext}`;
        // Save to videos folder at project root (monorepo root)
        const uploadDir = path.join(process.cwd(), "..", "..", "videos");
        const filePath = path.join(uploadDir, filename);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        await writeFile(filePath, buffer);

        // 5. Extract comprehensive metadata using ffprobe
        console.log("Extracting metadata from:", filePath);
        const metadata = await extractVideoMetadata(filePath);
        console.log("Extracted metadata:", JSON.stringify(metadata, null, 2));

        // 6. Reverse geocode if GPS coordinates available
        let locationName: string | null = null;
        if (metadata.latitude && metadata.longitude) {
            console.log("Reverse geocoding:", metadata.latitude, metadata.longitude);
            locationName = await reverseGeocode(metadata.latitude, metadata.longitude);
            console.log("Location name:", locationName);
        }

        // 7. Update DB with all metadata
        const publicUrl = `/api/videos/${filename}`;

        await db
            .update(video)
            .set({
                storagePath: filePath,
                streamUrl: publicUrl,
                processingStatus: "completed",
                processingProgress: 100,

                // Video metadata
                duration: metadata.duration,
                width: metadata.width,
                height: metadata.height,
                frameRate: metadata.frameRate,
                codec: metadata.codec,
                bitrate: metadata.bitrate,
                aspectRatio: metadata.aspectRatio,

                // Audio metadata
                audioCodec: metadata.audioCodec,
                audioChannels: metadata.audioChannels,
                audioSampleRate: metadata.audioSampleRate,
                audioBitrate: metadata.audioBitrate,

                // GPS/Location metadata
                latitude: metadata.latitude,
                longitude: metadata.longitude,
                altitude: metadata.altitude,
                locationName: locationName,

                // Camera/Device metadata
                cameraModel: metadata.cameraModel,
                cameraMake: metadata.cameraMake,
                software: metadata.software,

                // Date/Time metadata
                recordedAt: metadata.recordedAt,

                // Store raw metadata as JSON
                rawMetadata: metadata.rawMetadata,
            })
            .where(eq(video.id, videoId));

        return NextResponse.json({
            success: true,
            url: publicUrl,
            metadata: {
                duration: metadata.duration,
                resolution: metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : null,
                location: locationName,
                recordedAt: metadata.recordedAt,
            }
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
