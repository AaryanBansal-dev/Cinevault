"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import {
	Upload,
	FileVideo,
	CheckCircle,
	AlertCircle,
	X,
	ChevronLeft,
	ChevronRight,
	Image as ImageIcon,
	Loader2,
	Folder,
	FolderPlus,
	Film,
} from "lucide-react";

interface UploadState {
	file: File | null;
	progress: number;
	status: "idle" | "uploading" | "processing" | "complete" | "error";
	error: string | null;
}

export default function UploadPage() {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const thumbnailInputRef = useRef<HTMLInputElement>(null);

	const [step, setStep] = useState(1);
	const [uploadState, setUploadState] = useState<UploadState>({
		file: null,
		progress: 0,
		status: "idle",
		error: null,
	});

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		folderId: "",
		newFolderName: "",
		thumbnail: null as File | null,
		thumbnailPreview: "",
	});

	const [isDragging, setIsDragging] = useState(false);
	const [showNewFolder, setShowNewFolder] = useState(false);
	const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);

	// Fetch folders
	const { data: folders } = trpc.folder.getAll.useQuery();
	const utils = trpc.useUtils();

	// Mutations
	const createFolder = trpc.folder.create.useMutation({
		onSuccess: (folder) => {
			setFormData((prev) => ({ ...prev, folderId: folder.id, newFolderName: "" }));
			setShowNewFolder(false);
			utils.folder.getAll.invalidate();
		},
	});

	const createVideo = trpc.video.create.useMutation();
	const updateProcessing = trpc.video.updateProcessingStatus.useMutation();

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	}, []);

	const handleFileSelect = (file: File) => {
		if (!file.type.startsWith("video/")) {
			setUploadState({
				...uploadState,
				error: "Please select a valid video file",
			});
			return;
		}

		// Extract filename for default title
		const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

		setFormData((prev) => ({ ...prev, title }));
		setUploadState({
			file,
			progress: 0,
			status: "idle",
			error: null,
		});
		setStep(2);
	};

	const handleThumbnailSelect = (file: File) => {
		if (!file.type.startsWith("image/")) {
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			setFormData((prev) => ({
				...prev,
				thumbnail: file,
				thumbnailPreview: reader.result as string,
			}));
		};
		reader.readAsDataURL(file);
	};

	const handleCreateFolder = () => {
		if (!formData.newFolderName.trim()) return;
		createFolder.mutate({ name: formData.newFolderName });
	};

	const handleSubmit = async () => {
		if (!uploadState.file || !formData.title) return;

		setUploadState((prev) => ({ ...prev, status: "uploading" }));
		setStep(3);

		try {
			// Create video record in database
			const video = await createVideo.mutateAsync({
				title: formData.title,
				description: formData.description || undefined,
				folderId: formData.folderId || undefined,
				originalFilename: uploadState.file.name,
				fileSize: uploadState.file.size,
				mimeType: uploadState.file.type,
			});

			setCreatedVideoId(video.id);


			// Perform actual upload
			const uploadFormData = new FormData();
			uploadFormData.append("file", uploadState.file);
			uploadFormData.append("videoId", video.id);

			const xhr = new XMLHttpRequest();
			
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const progress = (event.loaded / event.total) * 100;
					setUploadState((prev) => ({ 
						...prev, 
						progress,
						status: progress === 100 ? "processing" : "uploading"
					}));
					
					// Update status in DB occasionally (optional, but good for UI sync if user refreshes)
					if (progress % 10 === 0) {
						updateProcessing.mutate({
							id: video.id,
							status: "uploading",
							progress: Math.round(progress),
						});
					}
				}
			};

			xhr.onload = async () => {
				if (xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);
					
					setUploadState((prev) => ({ ...prev, status: "complete", progress: 100 }));
					
					// Invalidate queries to refresh lists
					utils.video.getAll.invalidate();
					utils.video.getStats.invalidate();
				} else {
					throw new Error("Upload failed");
				}
			};

			xhr.onerror = () => {
				throw new Error("Network error during upload");
			};

			xhr.open("POST", "/api/upload");
			xhr.send(uploadFormData);

		} catch (error) {
			setUploadState((prev) => ({
				...prev,
				status: "error",
				error: error instanceof Error ? error.message : "Upload failed",
			}));
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`;
		}
		if (bytes < 1024 * 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		}
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	};

	const resetForm = () => {
		setStep(1);
		setUploadState({ file: null, progress: 0, status: "idle", error: null });
		setFormData({
			title: "",
			description: "",
			folderId: "",
			newFolderName: "",
			thumbnail: null,
			thumbnailPreview: "",
		});
		setCreatedVideoId(null);
	};

	return (
		<div className="min-h-screen py-8">
			<div className="container mx-auto px-4 max-w-2xl">
				{/* Back Link */}
				<Link
					href="/library"
					className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
				>
					<ChevronLeft className="w-4 h-4" />
					Back to Library
				</Link>

				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">
						Upload <span className="gradient-text">Video</span>
					</h1>
					<p className="text-muted-foreground">
						Add a new video to your personal library
					</p>
				</div>

				{/* Progress Steps */}
				<div className="flex items-center justify-center mb-8">
					{[
						{ num: 1, label: "Select File" },
						{ num: 2, label: "Details" },
						{ num: 3, label: "Upload" },
					].map((s, i) => (
						<div key={s.num} className="flex items-center">
							<div className="flex flex-col items-center">
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
										step === s.num
											? "bg-primary text-primary-foreground"
											: step > s.num
											? "bg-green-500 text-white"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
								</div>
								<span className="text-xs mt-2 text-muted-foreground">
									{s.label}
								</span>
							</div>
							{i < 2 && (
								<div
									className={`w-16 sm:w-24 h-1 mx-2 rounded ${
										step > s.num ? "bg-green-500" : "bg-muted"
									}`}
								/>
							)}
						</div>
					))}
				</div>

				{/* Step Content */}
				<div className="bg-card rounded-2xl border border-border p-6 md:p-8">
					{/* Step 1: File Selection */}
					{step === 1 && (
						<div className="space-y-6 animate-fade-in">
							<div
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
								className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
									isDragging
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50 hover:bg-muted/50"
								}`}
							>
								<input
									ref={fileInputRef}
									type="file"
									accept="video/*"
									onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
									className="hidden"
								/>

								<div className="flex flex-col items-center gap-4">
									<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
										<Upload className="w-8 h-8 text-primary" />
									</div>
									<div>
										<p className="text-lg font-semibold mb-2">
											Drag and drop your video here
										</p>
										<p className="text-muted-foreground mb-2">
											or click to browse files
										</p>
										<p className="text-sm text-muted-foreground">
											Supports MP4, MOV, AVI, MKV, WebM
										</p>
									</div>
								</div>
							</div>

							{uploadState.error && (
								<div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg">
									<AlertCircle className="w-5 h-5" />
									{uploadState.error}
								</div>
							)}
						</div>
					)}

					{/* Step 2: Video Details */}
					{step === 2 && (
						<div className="space-y-6 animate-fade-in">
							{/* File Preview */}
							{uploadState.file && (
								<div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
									<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
										<FileVideo className="w-6 h-6 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{uploadState.file.name}</p>
										<p className="text-sm text-muted-foreground">
											{formatFileSize(uploadState.file.size)}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setUploadState({ file: null, progress: 0, status: "idle", error: null });
											setStep(1);
										}}
									>
										<X className="w-5 h-5" />
									</Button>
								</div>
							)}

							<div className="grid gap-6">
								{/* Title */}
								<div className="space-y-2">
									<Label htmlFor="title">Title *</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
										placeholder="Enter video title"
									/>
								</div>

								{/* Description */}
								<div className="space-y-2">
									<Label htmlFor="description">Description (optional)</Label>
									<textarea
										id="description"
										value={formData.description}
										onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
										placeholder="Add notes about this video..."
										className="w-full p-3 rounded-lg bg-input border border-border focus:border-primary outline-none resize-none min-h-24"
										rows={3}
									/>
								</div>

								{/* Folder */}
								<div className="space-y-2">
									<Label>Folder</Label>
									{!showNewFolder ? (
										<div className="space-y-2">
											<select
												value={formData.folderId}
												onChange={(e) => setFormData((prev) => ({ ...prev, folderId: e.target.value }))}
												className="w-full p-3 rounded-lg bg-input border border-border focus:border-primary outline-none"
											>
												<option value="">No folder</option>
												{folders?.map((folder) => (
													<option key={folder.id} value={folder.id}>
														{folder.name}
													</option>
												))}
											</select>
											<button
												type="button"
												onClick={() => setShowNewFolder(true)}
												className="text-sm text-primary hover:underline flex items-center gap-1"
											>
												<FolderPlus className="w-4 h-4" />
												Create new folder
											</button>
										</div>
									) : (
										<div className="space-y-2">
											<div className="flex gap-2">
												<Input
													value={formData.newFolderName}
													onChange={(e) => setFormData((prev) => ({ ...prev, newFolderName: e.target.value }))}
													placeholder="New folder name"
												/>
												<Button
													onClick={handleCreateFolder}
													disabled={!formData.newFolderName.trim() || createFolder.isPending}
												>
													{createFolder.isPending ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														"Create"
													)}
												</Button>
												<Button
													variant="ghost"
													onClick={() => {
														setShowNewFolder(false);
														setFormData((prev) => ({ ...prev, newFolderName: "" }));
													}}
												>
													Cancel
												</Button>
											</div>
										</div>
									)}
								</div>

								{/* Thumbnail */}
								<div className="space-y-2">
									<Label>Thumbnail (optional)</Label>
									<div className="flex gap-4">
										<div
											onClick={() => thumbnailInputRef.current?.click()}
											className="w-40 aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden"
										>
											{formData.thumbnailPreview ? (
												<img
													src={formData.thumbnailPreview}
													alt="Thumbnail"
													className="w-full h-full object-cover"
												/>
											) : (
												<>
													<ImageIcon className="w-6 h-6 text-muted-foreground" />
													<span className="text-xs text-muted-foreground">
														Add thumbnail
													</span>
												</>
											)}
										</div>
										<input
											ref={thumbnailInputRef}
											type="file"
											accept="image/*"
											onChange={(e) =>
												e.target.files?.[0] && handleThumbnailSelect(e.target.files[0])
											}
											className="hidden"
										/>
										<p className="text-xs text-muted-foreground self-end">
											A thumbnail will be auto-generated if not provided
										</p>
									</div>
								</div>
							</div>

							{/* Navigation */}
							<div className="flex justify-between pt-4">
								<Button variant="outline" onClick={() => setStep(1)}>
									<ChevronLeft className="w-4 h-4 mr-2" />
									Back
								</Button>
								<Button onClick={handleSubmit} disabled={!formData.title}>
									Upload Video
									<Upload className="w-4 h-4 ml-2" />
								</Button>
							</div>
						</div>
					)}

					{/* Step 3: Upload Progress */}
					{step === 3 && (
						<div className="space-y-8 animate-fade-in text-center py-8">
							{uploadState.status === "uploading" && (
								<>
									<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
										<Upload className="w-10 h-10 text-primary animate-pulse" />
									</div>
									<div>
										<h2 className="text-xl font-bold mb-2">Uploading Video</h2>
										<p className="text-muted-foreground">
											Please don't close this window...
										</p>
									</div>
									<div className="max-w-sm mx-auto">
										<div className="flex justify-between text-sm mb-2">
											<span>Progress</span>
											<span>{Math.round(uploadState.progress)}%</span>
										</div>
										<div className="h-3 bg-muted rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
												style={{ width: `${uploadState.progress}%` }}
											/>
										</div>
									</div>
								</>
							)}

							{uploadState.status === "processing" && (
								<>
									<div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
										<Loader2 className="w-10 h-10 text-accent animate-spin" />
									</div>
									<div>
										<h2 className="text-xl font-bold mb-2">Processing Video</h2>
										<p className="text-muted-foreground">
											Generating thumbnail and optimizing for playback...
										</p>
									</div>
								</>
							)}

							{uploadState.status === "complete" && (
								<>
									<div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
										<CheckCircle className="w-10 h-10 text-green-500" />
									</div>
									<div>
										<h2 className="text-xl font-bold mb-2">Upload Complete!</h2>
										<p className="text-muted-foreground">
											Your video has been added to your library
										</p>
									</div>
									<div className="flex justify-center gap-4">
										<Button variant="outline" onClick={resetForm}>
											Upload Another
										</Button>
										{createdVideoId ? (
											<Button onClick={() => router.push(`/watch/${createdVideoId}`)}>
												<Film className="w-4 h-4 mr-2" />
												Watch Video
											</Button>
										) : (
											<Button onClick={() => router.push("/library")}>
												<Film className="w-4 h-4 mr-2" />
												Go to Library
											</Button>
										)}
									</div>
								</>
							)}

							{uploadState.status === "error" && (
								<>
									<div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
										<AlertCircle className="w-10 h-10 text-destructive" />
									</div>
									<div>
										<h2 className="text-xl font-bold mb-2">Upload Failed</h2>
										<p className="text-muted-foreground">
											{uploadState.error || "Something went wrong"}
										</p>
									</div>
									<Button onClick={resetForm}>
										Try Again
									</Button>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
