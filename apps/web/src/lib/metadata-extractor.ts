import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface VideoMetadata {
    // Video
    duration: number;
    width: number | null;
    height: number | null;
    frameRate: number | null;
    codec: string | null;
    bitrate: number | null;
    aspectRatio: string | null;

    // Audio
    audioCodec: string | null;
    audioChannels: number | null;
    audioSampleRate: number | null;
    audioBitrate: number | null;

    // GPS/Location
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;

    // Camera/Device
    cameraModel: string | null;
    cameraMake: string | null;
    software: string | null;

    // Date/Time
    recordedAt: Date | null;

    // Raw metadata object
    rawMetadata: Record<string, unknown>;
}

/**
 * Extract comprehensive metadata from a video file using ffprobe
 */
export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
    try {
        // Run ffprobe to get all metadata in JSON format
        const { stdout } = await execAsync(
            `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
            { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large metadata
        );

        const probeData = JSON.parse(stdout);
        const format = probeData.format || {};
        const streams = probeData.streams || [];

        // Find video and audio streams
        const videoStream = streams.find((s: any) => s.codec_type === "video");
        const audioStream = streams.find((s: any) => s.codec_type === "audio");

        // Extract tags from format
        const tags = format.tags || {};

        // Parse GPS coordinates from various tag formats
        const gpsData = parseGPSFromTags(tags);

        // Parse frame rate (can be "30/1" or "29.97")
        let frameRate: number | null = null;
        if (videoStream?.r_frame_rate) {
            const fps = videoStream.r_frame_rate;
            if (fps.includes("/")) {
                const [num, den] = fps.split("/").map(Number);
                frameRate = den ? Math.round((num / den) * 100) / 100 : null;
            } else {
                frameRate = parseFloat(fps);
            }
        }

        // Parse aspect ratio
        let aspectRatio: string | null = null;
        if (videoStream?.display_aspect_ratio) {
            aspectRatio = videoStream.display_aspect_ratio;
        } else if (videoStream?.width && videoStream?.height) {
            const gcd = getGCD(videoStream.width, videoStream.height);
            aspectRatio = `${videoStream.width / gcd}:${videoStream.height / gcd}`;
        }

        // Parse recorded date from various possible tags
        const recordedAt = parseRecordedDate(tags);

        // Calculate bitrate
        const bitrate = format.bit_rate ? parseInt(format.bit_rate) :
            (videoStream?.bit_rate ? parseInt(videoStream.bit_rate) : null);

        const result: VideoMetadata = {
            // Video
            duration: Math.round(parseFloat(format.duration || videoStream?.duration || "0")),
            width: videoStream?.width || null,
            height: videoStream?.height || null,
            frameRate,
            codec: videoStream?.codec_name || null,
            bitrate,
            aspectRatio,

            // Audio
            audioCodec: audioStream?.codec_name || null,
            audioChannels: audioStream?.channels || null,
            audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : null,
            audioBitrate: audioStream?.bit_rate ? parseInt(audioStream.bit_rate) : null,

            // GPS/Location
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            altitude: gpsData.altitude,

            // Camera/Device
            cameraModel: tags.model || tags.com?.apple?.quicktime?.model || null,
            cameraMake: tags.make || tags.com?.apple?.quicktime?.make || null,
            software: tags.encoder || tags.software || tags.handler_name || null,

            // Date/Time
            recordedAt,

            // Store all raw metadata
            rawMetadata: {
                format: {
                    filename: format.filename,
                    nb_streams: format.nb_streams,
                    format_name: format.format_name,
                    format_long_name: format.format_long_name,
                    duration: format.duration,
                    size: format.size,
                    bit_rate: format.bit_rate,
                    tags: format.tags,
                },
                video: videoStream ? {
                    codec_name: videoStream.codec_name,
                    codec_long_name: videoStream.codec_long_name,
                    profile: videoStream.profile,
                    width: videoStream.width,
                    height: videoStream.height,
                    display_aspect_ratio: videoStream.display_aspect_ratio,
                    pix_fmt: videoStream.pix_fmt,
                    level: videoStream.level,
                    color_space: videoStream.color_space,
                    color_range: videoStream.color_range,
                    r_frame_rate: videoStream.r_frame_rate,
                    bit_rate: videoStream.bit_rate,
                    tags: videoStream.tags,
                } : null,
                audio: audioStream ? {
                    codec_name: audioStream.codec_name,
                    codec_long_name: audioStream.codec_long_name,
                    sample_rate: audioStream.sample_rate,
                    channels: audioStream.channels,
                    channel_layout: audioStream.channel_layout,
                    bit_rate: audioStream.bit_rate,
                    tags: audioStream.tags,
                } : null,
            },
        };

        return result;
    } catch (error) {
        console.error("Error extracting video metadata:", error);
        // Return minimal metadata on error
        return {
            duration: 0,
            width: null,
            height: null,
            frameRate: null,
            codec: null,
            bitrate: null,
            aspectRatio: null,
            audioCodec: null,
            audioChannels: null,
            audioSampleRate: null,
            audioBitrate: null,
            latitude: null,
            longitude: null,
            altitude: null,
            cameraModel: null,
            cameraMake: null,
            software: null,
            recordedAt: null,
            rawMetadata: {},
        };
    }
}

/**
 * Parse GPS coordinates from various tag formats
 */
function parseGPSFromTags(tags: Record<string, any>): {
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
} {
    let latitude: number | null = null;
    let longitude: number | null = null;
    let altitude: number | null = null;

    // Try location tag (common in phone videos: "+37.7749-122.4194+14.000/")
    if (tags.location) {
        const match = tags.location.match(/([+-]\d+\.\d+)([+-]\d+\.\d+)(?:([+-]\d+\.\d+))?/);
        if (match) {
            latitude = parseFloat(match[1]);
            longitude = parseFloat(match[2]);
            if (match[3]) altitude = parseFloat(match[3]);
        }
    }

    // Try com.apple.quicktime.location.ISO6709 format
    const isoLocation = tags["com.apple.quicktime.location.ISO6709"] ||
        tags["location-eng"] ||
        tags["location-iso6709"];
    if (isoLocation) {
        const match = isoLocation.match(/([+-]\d+\.\d+)([+-]\d+\.\d+)(?:([+-]\d+\.\d+))?/);
        if (match) {
            latitude = parseFloat(match[1]);
            longitude = parseFloat(match[2]);
            if (match[3]) altitude = parseFloat(match[3]);
        }
    }

    // Try separate GPS tags
    if (tags.GPSLatitude && tags.GPSLongitude) {
        latitude = parseFloat(tags.GPSLatitude);
        longitude = parseFloat(tags.GPSLongitude);
        if (tags.GPSAltitude) altitude = parseFloat(tags.GPSAltitude);
    }

    return { latitude, longitude, altitude };
}

/**
 * Parse recording date from various tag formats
 */
function parseRecordedDate(tags: Record<string, any>): Date | null {
    const dateFields = [
        "creation_time",
        "date",
        "com.apple.quicktime.creationdate",
        "DateTimeOriginal",
        "CreateDate",
        "MediaCreateDate",
    ];

    for (const field of dateFields) {
        if (tags[field]) {
            const date = new Date(tags[field]);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }

    return null;
}

/**
 * Greatest Common Divisor (for aspect ratio calculation)
 */
function getGCD(a: number, b: number): number {
    return b === 0 ? a : getGCD(b, a % b);
}

/**
 * Reverse geocode coordinates to get location name using free API
 */
export async function reverseGeocode(
    latitude: number,
    longitude: number
): Promise<string | null> {
    try {
        // Use OpenStreetMap's Nominatim (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            {
                headers: {
                    "User-Agent": "CineVault/1.0", // Required by Nominatim
                },
            }
        );

        if (!response.ok) {
            console.error("Reverse geocoding failed:", response.status);
            return null;
        }

        const data = await response.json();

        // Build a readable location string
        const address = data.address || {};
        const parts: string[] = [];

        // Add relevant parts (most specific to least specific)
        if (address.neighbourhood) parts.push(address.neighbourhood);
        else if (address.suburb) parts.push(address.suburb);
        else if (address.village) parts.push(address.village);

        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.county) parts.push(address.county);

        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);

        return parts.length > 0 ? parts.join(", ") : data.display_name || null;
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}

/**
 * Format bitrate for display
 */
export function formatBitrate(bps: number | null): string {
    if (!bps) return "Unknown";
    if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
    if (bps >= 1000) return `${(bps / 1000).toFixed(0)} Kbps`;
    return `${bps} bps`;
}
