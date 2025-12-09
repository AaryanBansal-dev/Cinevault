"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import {
	Play,
	Pause,
	Volume2,
	VolumeX,
	Maximize,
	Minimize,
	Settings,
	SkipBack,
	SkipForward,
	ChevronLeft,
	Download,
	Edit,
	Trash2,
	Folder,
	Calendar,
	Clock,
	HardDrive,
	Film,
	Loader2,
	AlertCircle,
	Info,
	FileVideo,
	Eye,
	ChevronDown,
	ChevronUp,
	MonitorPlay,
	FileType,
	MapPin,
	Camera,
	Mic,
	Gauge,
	Smartphone,
	Globe,
	Mountain,
	Music,
	CalendarClock,
} from "lucide-react";

function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

function formatDateTime(date: Date | string): string {
	return new Date(date).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

function formatBitrate(bps: number | null): string {
	if (!bps) return "Unknown";
	if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
	if (bps >= 1000) return `${(bps / 1000).toFixed(0)} Kbps`;
	return `${bps} bps`;
}

function formatSampleRate(hz: number | null): string {
	if (!hz) return "Unknown";
	if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
	return `${hz} Hz`;
}

function formatCoordinate(value: number, type: "lat" | "lon"): string {
	const direction = type === "lat" 
		? (value >= 0 ? "N" : "S") 
		: (value >= 0 ? "E" : "W");
	return `${Math.abs(value).toFixed(6)}° ${direction}`;
}

function formatChannels(channels: number | null): string {
	if (!channels) return "Unknown";
	if (channels === 1) return "Mono";
	if (channels === 2) return "Stereo";
	if (channels === 6) return "5.1 Surround";
	if (channels === 8) return "7.1 Surround";
	return `${channels} channels`;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showControls, setShowControls] = useState(true);
	const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

	// Fetch video data
	const { data: video, isLoading, error } = trpc.video.getById.useQuery({ id });
	const { data: relatedVideos } = trpc.video.getRelated.useQuery(
		{ videoId: id, limit: 5 },
		{ enabled: !!video }
	);
	const { data: folders } = trpc.folder.getAll.useQuery();

	const utils = trpc.useUtils();
	const updateProgress = trpc.video.updateProgress.useMutation();
	const deleteVideo = trpc.video.delete.useMutation({
		onSuccess: () => {
			router.push("/library");
		},
	});

	// Update time
	useEffect(() => {
		const videoEl = videoRef.current;
		if (!videoEl) return;

		const handleTimeUpdate = () => setCurrentTime(videoEl.currentTime);
		const handleLoadedMetadata = () => setDuration(videoEl.duration);
		const handleEnded = () => {
			setIsPlaying(false);
			// Mark as completed
			updateProgress.mutate({
				videoId: id,
				progressSeconds: Math.floor(videoEl.duration),
				progressPercent: 100,
				completed: true,
			});
		};

		videoEl.addEventListener("timeupdate", handleTimeUpdate);
		videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);
		videoEl.addEventListener("ended", handleEnded);

		return () => {
			videoEl.removeEventListener("timeupdate", handleTimeUpdate);
			videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
			videoEl.removeEventListener("ended", handleEnded);
		};
	}, [id]);

	// Save progress periodically
	useEffect(() => {
		if (!isPlaying || duration === 0) return;

		const interval = setInterval(() => {
			const progress = Math.round((currentTime / duration) * 100);
			updateProgress.mutate({
				videoId: id,
				progressSeconds: Math.floor(currentTime),
				progressPercent: progress,
			});
		}, 30000); // Every 30 seconds

		return () => clearInterval(interval);
	}, [isPlaying, currentTime, duration, id]);

	// Hide controls after inactivity
	useEffect(() => {
		let timeout: NodeJS.Timeout;
		
		const handleMouseMove = () => {
			setShowControls(true);
			clearTimeout(timeout);
			if (isPlaying) {
				timeout = setTimeout(() => setShowControls(false), 3000);
			}
		};

		const container = containerRef.current;
		container?.addEventListener("mousemove", handleMouseMove);
		container?.addEventListener("mouseleave", () => isPlaying && setShowControls(false));

		return () => {
			container?.removeEventListener("mousemove", handleMouseMove);
			clearTimeout(timeout);
		};
	}, [isPlaying]);

	const togglePlay = () => {
		if (videoRef.current) {
			if (isPlaying) {
				videoRef.current.pause();
			} else {
				videoRef.current.play();
			}
			setIsPlaying(!isPlaying);
		}
	};

	const toggleMute = () => {
		if (videoRef.current) {
			videoRef.current.muted = !isMuted;
			setIsMuted(!isMuted);
		}
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(e.target.value);
		if (videoRef.current) {
			videoRef.current.volume = value;
			setVolume(value);
			setIsMuted(value === 0);
		}
	};

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!progressRef.current || !videoRef.current) return;
		
		const rect = progressRef.current.getBoundingClientRect();
		const percentage = (e.clientX - rect.left) / rect.width;
		const newTime = percentage * duration;
		
		videoRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const skip = (seconds: number) => {
		if (videoRef.current) {
			videoRef.current.currentTime += seconds;
		}
	};

	const toggleFullscreen = () => {
		if (!containerRef.current) return;

		if (!document.fullscreenElement) {
			containerRef.current.requestFullscreen();
			setIsFullscreen(true);
		} else {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
	const folderName = video?.folderId ? folders?.find((f) => f.id === video.folderId)?.name : null;

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-10 h-10 animate-spin text-primary" />
			</div>
		);
	}

	if (error || !video) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center gap-4">
				<AlertCircle className="w-16 h-16 text-destructive" />
				<h1 className="text-2xl font-bold">Video Not Found</h1>
				<p className="text-muted-foreground">This video doesn't exist or you don't have access to it.</p>
				<Button asChild>
					<Link href="/library">Back to Library</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Back Button */}
			<div className="container mx-auto px-4 py-4">
				<Link
					href="/library"
					className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
					Back to Library
				</Link>
			</div>

			{/* Video Player Section */}
			<div
				ref={containerRef}
				className="relative bg-black w-full aspect-video max-h-[75vh] group"
			>
				{/* Video Element */}
				{video.streamUrl ? (
					<video
						ref={videoRef}
						src={video.streamUrl}
						poster={video.thumbnailUrl ?? undefined}
						className="w-full h-full object-contain"
						onClick={togglePlay}
						onError={(e) => {
							const target = e.target as HTMLVideoElement;
							// If the video fails to load (e.g. expired blob URL), fallback to sample
							if (target.src !== "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4") {
								target.src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
							}
						}}
					/>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white">
						<Film className="w-16 h-16 opacity-50" />
						<p className="text-lg">Video not available for streaming</p>
						{video.processingStatus !== "completed" && (
							<p className="text-sm opacity-70">
								Status: {video.processingStatus} ({video.processingProgress}%)
							</p>
						)}
					</div>
				)}

				{/* Play/Pause Overlay */}
				{!isPlaying && video.streamUrl && (
					<div
						className="absolute inset-0 flex items-center justify-center cursor-pointer"
						onClick={togglePlay}
					>
						<div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
							<Play className="w-8 h-8 fill-current ml-1" />
						</div>
					</div>
				)}

				{/* Controls */}
				{video.streamUrl && (
					<div
						className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
							showControls ? "opacity-100" : "opacity-0"
						}`}
					>
						{/* Progress Bar */}
						<div
							ref={progressRef}
							className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-4 group/progress"
							onClick={handleSeek}
						>
							<div
								className="h-full bg-primary rounded-full relative"
								style={{ width: `${progress}%` }}
							>
								<div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
							</div>
						</div>

						<div className="flex items-center justify-between">
							{/* Left Controls */}
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									onClick={togglePlay}
									className="text-white hover:bg-white/20"
								>
									{isPlaying ? (
										<Pause className="w-5 h-5" />
									) : (
										<Play className="w-5 h-5 ml-0.5" />
									)}
								</Button>

								<Button
									variant="ghost"
									size="icon"
									onClick={() => skip(-10)}
									className="text-white hover:bg-white/20"
								>
									<SkipBack className="w-5 h-5" />
								</Button>

								<Button
									variant="ghost"
									size="icon"
									onClick={() => skip(10)}
									className="text-white hover:bg-white/20"
								>
									<SkipForward className="w-5 h-5" />
								</Button>

								{/* Volume */}
								<div className="flex items-center gap-2 group/volume">
									<Button
										variant="ghost"
										size="icon"
										onClick={toggleMute}
										className="text-white hover:bg-white/20"
									>
										{isMuted || volume === 0 ? (
											<VolumeX className="w-5 h-5" />
										) : (
											<Volume2 className="w-5 h-5" />
										)}
									</Button>
									<input
										type="range"
										min="0"
										max="1"
										step="0.05"
										value={isMuted ? 0 : volume}
										onChange={handleVolumeChange}
										className="w-0 group-hover/volume:w-20 transition-all overflow-hidden accent-primary"
									/>
								</div>

								{/* Time */}
								<span className="text-white text-sm ml-2">
									{formatTime(currentTime)} / {formatTime(duration)}
								</span>
							</div>

							{/* Right Controls */}
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="text-white hover:bg-white/20"
								>
									<Settings className="w-5 h-5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={toggleFullscreen}
									className="text-white hover:bg-white/20"
								>
									{isFullscreen ? (
										<Minimize className="w-5 h-5" />
									) : (
										<Maximize className="w-5 h-5" />
									)}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Video Info */}
			<div className="container mx-auto px-4 py-6">
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Title & Actions */}
						<div>
							<h1 className="text-2xl md:text-3xl font-bold mb-4">
								{video.title}
							</h1>

							<div className="flex flex-wrap items-center gap-3">
								{video.streamUrl && (
									<Button variant="secondary" asChild>
										<a href={video.streamUrl} download>
											<Download className="w-4 h-4 mr-2" />
											Download
										</a>
									</Button>
								)}
								<Button variant="secondary">
									<Edit className="w-4 h-4 mr-2" />
									Edit Details
								</Button>
								<Button
									variant="secondary"
									className="text-destructive hover:text-destructive"
									onClick={() => {
										if (confirm("Are you sure you want to delete this video?")) {
											deleteVideo.mutate({ id: video.id });
										}
									}}
									disabled={deleteVideo.isPending}
								>
									{deleteVideo.isPending ? (
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									) : (
										<Trash2 className="w-4 h-4 mr-2" />
									)}
									Delete
								</Button>
							</div>
						</div>

						{/* Metadata Viewer */}
						<div className="rounded-xl bg-card border border-border overflow-hidden">
							{/* Header */}
							<div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/30">
								<Info className="w-5 h-5 text-primary" />
								<h3 className="font-semibold">Video Metadata</h3>
							</div>
							
							{/* Primary Info Grid */}
							<div className="p-6 space-y-6">
								<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
									{/* Upload Date */}
									<div className="space-y-1">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Calendar className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">Uploaded</span>
										</div>
										<p className="font-medium">{formatDate(video.createdAt)}</p>
									</div>

									{/* Recorded Date */}
									{video.recordedAt && (
										<div className="space-y-1">
											<div className="flex items-center gap-2 text-muted-foreground">
												<CalendarClock className="w-4 h-4" />
												<span className="text-xs uppercase tracking-wide">Recorded</span>
											</div>
											<p className="font-medium">{formatDateTime(video.recordedAt)}</p>
										</div>
									)}

									{/* File Size */}
									<div className="space-y-1">
										<div className="flex items-center gap-2 text-muted-foreground">
											<HardDrive className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">File Size</span>
										</div>
										<p className="font-medium">{formatFileSize(video.fileSize)}</p>
									</div>

									{/* Duration */}
									<div className="space-y-1">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Clock className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">Duration</span>
										</div>
										<p className="font-medium">
											{video.duration > 0 ? formatTime(video.duration) : "Calculating..."}
										</p>
									</div>

									{/* Resolution */}
									{(video.width && video.height) && (
										<div className="space-y-1">
											<div className="flex items-center gap-2 text-muted-foreground">
												<MonitorPlay className="w-4 h-4" />
												<span className="text-xs uppercase tracking-wide">Resolution</span>
											</div>
											<p className="font-medium">
												{video.width} × {video.height}
												{video.width >= 3840 && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">4K</span>}
												{video.width >= 1920 && video.width < 3840 && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">Full HD</span>}
												{video.width >= 1280 && video.width < 1920 && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">HD</span>}
											</p>
										</div>
									)}

									{/* Aspect Ratio */}
									{video.aspectRatio && (
										<div className="space-y-1">
											<div className="flex items-center gap-2 text-muted-foreground">
												<Film className="w-4 h-4" />
												<span className="text-xs uppercase tracking-wide">Aspect Ratio</span>
											</div>
											<p className="font-medium">{video.aspectRatio}</p>
										</div>
									)}

									{/* Views */}
									<div className="space-y-1">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Eye className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">Views</span>
										</div>
										<p className="font-medium">{video.viewCount.toLocaleString()}</p>
									</div>

									{/* Folder */}
									{folderName && (
										<div className="space-y-1">
											<div className="flex items-center gap-2 text-muted-foreground">
												<Folder className="w-4 h-4" />
												<span className="text-xs uppercase tracking-wide">Folder</span>
											</div>
											<p className="font-medium">{folderName}</p>
										</div>
									)}
								</div>

								{/* Location Section */}
								{(video.latitude && video.longitude) && (
									<div className="pt-4 border-t border-border">
										<div className="flex items-center gap-2 text-muted-foreground mb-3">
											<MapPin className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">Location</span>
										</div>
										<div className="bg-muted/30 rounded-lg p-4 space-y-3">
											{/* Location Name */}
											{video.locationName && (
												<p className="font-medium text-lg flex items-center gap-2">
													<Globe className="w-4 h-4 text-primary" />
													{video.locationName}
												</p>
											)}
											{/* Coordinates */}
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
												<div>
													<span className="text-muted-foreground text-xs">Latitude</span>
													<p className="font-mono">{formatCoordinate(video.latitude, "lat")}</p>
												</div>
												<div>
													<span className="text-muted-foreground text-xs">Longitude</span>
													<p className="font-mono">{formatCoordinate(video.longitude, "lon")}</p>
												</div>
												{video.altitude && (
													<div>
														<span className="text-muted-foreground text-xs flex items-center gap-1">
															<Mountain className="w-3 h-3" /> Altitude
														</span>
														<p className="font-mono">{video.altitude.toFixed(1)} m</p>
													</div>
												)}
											</div>
											{/* Map Link */}
											<a
												href={`https://www.google.com/maps?q=${video.latitude},${video.longitude}`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
											>
												<Globe className="w-4 h-4" />
												View on Google Maps →
											</a>
										</div>
									</div>
								)}

								{/* Camera/Device Info */}
								{(video.cameraMake || video.cameraModel || video.software) && (
									<div className="pt-4 border-t border-border">
										<div className="flex items-center gap-2 text-muted-foreground mb-3">
											<Camera className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">Camera / Device</span>
										</div>
										<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
											{video.cameraMake && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Make</span>
													<p className="font-medium">{video.cameraMake}</p>
												</div>
											)}
											{video.cameraModel && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Model</span>
													<p className="font-medium">{video.cameraModel}</p>
												</div>
											)}
											{video.software && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Software</span>
													<p className="font-medium">{video.software}</p>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Audio Info */}
								{(video.audioCodec || video.audioChannels || video.audioSampleRate) && (
									<div className="pt-4 border-t border-border">
										<div className="flex items-center gap-2 text-muted-foreground mb-3">
											<Music className="w-4 h-4" />
											<span className="text-xs uppercase tracking-wide">Audio</span>
										</div>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
											{video.audioCodec && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Codec</span>
													<p className="font-medium">{video.audioCodec.toUpperCase()}</p>
												</div>
											)}
											{video.audioChannels && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Channels</span>
													<p className="font-medium">{formatChannels(video.audioChannels)}</p>
												</div>
											)}
											{video.audioSampleRate && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Sample Rate</span>
													<p className="font-medium">{formatSampleRate(video.audioSampleRate)}</p>
												</div>
											)}
											{video.audioBitrate && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Bitrate</span>
													<p className="font-medium">{formatBitrate(video.audioBitrate)}</p>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Description */}
								{video.description && (
									<div className="pt-4 border-t border-border">
										<p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Description</p>
										<p className="text-sm whitespace-pre-wrap leading-relaxed">{video.description}</p>
									</div>
								)}

								{/* Technical Details (Expandable) */}
								<div className="pt-4 border-t border-border">
									<button
										onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
										className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										<span className="flex items-center gap-2">
											<FileVideo className="w-4 h-4" />
											<span className="uppercase tracking-wide text-xs">Technical Details</span>
										</span>
										{showTechnicalDetails ? (
											<ChevronUp className="w-4 h-4" />
										) : (
											<ChevronDown className="w-4 h-4" />
										)}
									</button>
									
									{showTechnicalDetails && (
										<div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm animate-in slide-in-from-top-2 duration-200">
											{video.originalFilename && (
												<div className="col-span-2 md:col-span-3 space-y-1">
													<span className="text-muted-foreground text-xs">Original Filename</span>
													<p className="font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all">{video.originalFilename}</p>
												</div>
											)}
											{video.mimeType && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Container Format</span>
													<p className="font-medium">{video.mimeType}</p>
												</div>
											)}
											{video.codec && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Video Codec</span>
													<p className="font-medium">{video.codec.toUpperCase()}</p>
												</div>
											)}
											{video.frameRate && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Frame Rate</span>
													<p className="font-medium">{video.frameRate} fps</p>
												</div>
											)}
											{video.bitrate && (
												<div className="space-y-1">
													<span className="text-muted-foreground text-xs">Video Bitrate</span>
													<p className="font-medium">{formatBitrate(video.bitrate)}</p>
												</div>
											)}
											<div className="space-y-1">
												<span className="text-muted-foreground text-xs">Processing Status</span>
												<p className="font-medium flex items-center gap-1.5">
													<span className={`w-2 h-2 rounded-full ${video.processingStatus === 'completed' ? 'bg-green-500' : video.processingStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
													{video.processingStatus.charAt(0).toUpperCase() + video.processingStatus.slice(1)}
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Sidebar - Related videos */}
					{relatedVideos && relatedVideos.length > 0 && (
						<div className="space-y-4">
							<h2 className="font-semibold">
								{folderName ? `More from "${folderName}"` : "Other Videos"}
							</h2>
							<div className="space-y-4">
								{relatedVideos.map((related) => (
									<Link
										key={related.id}
										href={`/watch/${related.id}`}
										className="flex gap-3 group"
									>
										<div className="relative w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
											<div className="aspect-video">
												{related.thumbnailUrl ? (
													<img
														src={related.thumbnailUrl}
														alt={related.title}
														className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Film className="w-6 h-6 text-muted-foreground" />
													</div>
												)}
											</div>
											{related.duration > 0 && (
												<div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-xs">
													{formatTime(related.duration)}
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0 py-1">
											<h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
												{related.title}
											</h3>
											<p className="text-xs text-muted-foreground mt-1">
												{formatFileSize(related.fileSize)}
											</p>
										</div>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
