"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
	User,
	Shield,
	HardDrive,
	Bell,
	Palette,
	Trash2,
	Camera,
	Save,
	AlertTriangle,
	Loader2,
} from "lucide-react";

const tabs = [
	{ id: "profile", label: "Profile", icon: User },
	{ id: "storage", label: "Storage", icon: HardDrive },
	{ id: "security", label: "Security", icon: Shield },
	{ id: "notifications", label: "Notifications", icon: Bell },
	{ id: "appearance", label: "Appearance", icon: Palette },
];

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SettingsPage() {
	const { data: session } = authClient.useSession();
	const [activeTab, setActiveTab] = useState("profile");
	const [profileForm, setProfileForm] = useState({
		name: "",
		email: "",
	});

	// Fetch settings
	const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery();
	const { data: storageBreakdown, isLoading: storageLoading } = trpc.settings.getStorageBreakdown.useQuery();

	const utils = trpc.useUtils();
	const updateSettings = trpc.settings.update.useMutation({
		onSuccess: () => {
			toast.success("Settings saved");
			utils.settings.get.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Initialize form with session data
	useEffect(() => {
		if (session?.user) {
			setProfileForm({
				name: session.user.name ?? "",
				email: session.user.email ?? "",
			});
		}
	}, [session]);

	const storageUsedPercent = storageBreakdown
		? (storageBreakdown.total / storageBreakdown.storageLimit) * 100
		: 0;

	return (
		<div className="min-h-screen py-8">
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">
						<span className="gradient-text">Settings</span>
					</h1>
					<p className="text-muted-foreground">
						Manage your account and preferences
					</p>
				</div>

				<div className="flex flex-col md:flex-row gap-8">
					{/* Sidebar */}
					<aside className="md:w-56 shrink-0">
						<nav className="space-y-1">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
										activeTab === tab.id
											? "bg-primary/10 text-primary"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									}`}
								>
									<tab.icon className="w-5 h-5" />
									{tab.label}
								</button>
							))}
						</nav>
					</aside>

					{/* Content */}
					<main className="flex-1 max-w-2xl">
						{/* Profile Tab */}
						{activeTab === "profile" && (
							<div className="space-y-6 animate-fade-in">
								<div className="rounded-2xl bg-card border border-border p-6 space-y-6">
									<h2 className="text-xl font-semibold">Profile Settings</h2>

									{/* Avatar */}
									<div className="flex items-center gap-6">
										<div className="relative">
											<div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
												{session?.user?.image ? (
													<img
														src={session.user.image}
														alt={session.user.name ?? "User"}
														className="w-full h-full rounded-full object-cover"
													/>
												) : (
													<span className="text-primary text-2xl font-bold">
														{session?.user?.name?.charAt(0).toUpperCase() || "U"}
													</span>
												)}
											</div>
											<button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
												<Camera className="w-4 h-4" />
											</button>
										</div>
										<div>
											<p className="font-medium">{session?.user?.name}</p>
											<p className="text-sm text-muted-foreground">
												{session?.user?.email}
											</p>
										</div>
									</div>

									{/* Form */}
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="name">Display Name</Label>
											<Input
												id="name"
												value={profileForm.name}
												onChange={(e) =>
													setProfileForm((prev) => ({ ...prev, name: e.target.value }))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												value={profileForm.email}
												onChange={(e) =>
													setProfileForm((prev) => ({ ...prev, email: e.target.value }))
												}
												disabled
											/>
											<p className="text-xs text-muted-foreground">
												Email cannot be changed here
											</p>
										</div>
									</div>

									<Button disabled>
										<Save className="w-4 h-4 mr-2" />
										Save Changes
									</Button>
								</div>
							</div>
						)}

						{/* Storage Tab */}
						{activeTab === "storage" && (
							<div className="space-y-6 animate-fade-in">
								<div className="rounded-2xl bg-card border border-border p-6 space-y-6">
									<h2 className="text-xl font-semibold">Storage Usage</h2>

									{storageLoading ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 className="w-8 h-8 animate-spin text-primary" />
										</div>
									) : storageBreakdown ? (
										<div className="space-y-4">
											<div>
												<div className="flex justify-between mb-2">
													<span className="text-sm text-muted-foreground">Used</span>
													<span className="font-medium">
														{formatFileSize(storageBreakdown.total)} / {formatFileSize(storageBreakdown.storageLimit)}
													</span>
												</div>
												<div className="h-3 bg-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-primary to-accent transition-all"
														style={{ width: `${Math.min(storageUsedPercent, 100)}%` }}
													/>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4 pt-4">
												<div className="p-4 rounded-xl bg-muted/50">
													<p className="text-2xl font-bold">{storageBreakdown.videoCount}</p>
													<p className="text-sm text-muted-foreground">Videos</p>
												</div>
												<div className="p-4 rounded-xl bg-muted/50">
													<p className="text-2xl font-bold">
														{formatFileSize(storageBreakdown.storageLimit - storageBreakdown.total)}
													</p>
													<p className="text-sm text-muted-foreground">Available</p>
												</div>
											</div>

											<div className="pt-4 border-t border-border">
												<h3 className="font-medium mb-4">Storage Breakdown</h3>
												<div className="space-y-3">
													<div className="flex items-center justify-between">
														<span className="text-sm">Videos</span>
														<span className="text-sm text-muted-foreground">
															{formatFileSize(storageBreakdown.videos)}
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span className="text-sm">Thumbnails</span>
														<span className="text-sm text-muted-foreground">
															{formatFileSize(storageBreakdown.thumbnails)}
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span className="text-sm">Transcoded copies</span>
														<span className="text-sm text-muted-foreground">
															{formatFileSize(storageBreakdown.transcoded)}
														</span>
													</div>
												</div>
											</div>
										</div>
									) : (
										<p className="text-muted-foreground">No storage data available</p>
									)}
								</div>

								<div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6">
									<h3 className="font-medium text-destructive flex items-center gap-2 mb-2">
										<AlertTriangle className="w-4 h-4" />
										Danger Zone
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Clear all transcoded copies to save space. Original files will be kept.
									</p>
									<Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
										<Trash2 className="w-4 h-4 mr-2" />
										Clear Transcoded Files
									</Button>
								</div>
							</div>
						)}

						{/* Security Tab */}
						{activeTab === "security" && (
							<div className="space-y-6 animate-fade-in">
								<div className="rounded-2xl bg-card border border-border p-6 space-y-6">
									<h2 className="text-xl font-semibold">Security</h2>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="current-password">Current Password</Label>
											<Input id="current-password" type="password" />
										</div>
										<div className="space-y-2">
											<Label htmlFor="new-password">New Password</Label>
											<Input id="new-password" type="password" />
										</div>
										<div className="space-y-2">
											<Label htmlFor="confirm-password">Confirm New Password</Label>
											<Input id="confirm-password" type="password" />
										</div>
									</div>

									<Button disabled>Update Password</Button>
								</div>

								<div className="rounded-2xl bg-card border border-border p-6 space-y-4">
									<h3 className="font-medium">Active Sessions</h3>
									<div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
										<div className="p-2 rounded-lg bg-green-500/10">
											<Shield className="w-5 h-5 text-green-500" />
										</div>
										<div className="flex-1">
											<p className="font-medium">Current Session</p>
											<p className="text-sm text-muted-foreground">
												This device • Last active now
											</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Notifications Tab */}
						{activeTab === "notifications" && (
							<div className="space-y-6 animate-fade-in">
								<div className="rounded-2xl bg-card border border-border p-6 space-y-6">
									<h2 className="text-xl font-semibold">Notification Preferences</h2>

									{settingsLoading ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 className="w-8 h-8 animate-spin text-primary" />
										</div>
									) : (
										<div className="space-y-4">
											<label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
												<div>
													<p className="font-medium">Upload Complete</p>
													<p className="text-sm text-muted-foreground">
														Get notified when video processing is complete
													</p>
												</div>
												<input
													type="checkbox"
													checked={settings?.uploadNotifications ?? true}
													onChange={(e) =>
														updateSettings.mutate({ uploadNotifications: e.target.checked })
													}
													className="w-5 h-5 accent-primary"
												/>
											</label>

											<label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
												<div>
													<p className="font-medium">Storage Warnings</p>
													<p className="text-sm text-muted-foreground">
														Notify when storage is running low
													</p>
												</div>
												<input
													type="checkbox"
													checked={settings?.storageWarnings ?? true}
													onChange={(e) =>
														updateSettings.mutate({ storageWarnings: e.target.checked })
													}
													className="w-5 h-5 accent-primary"
												/>
											</label>

											<label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
												<div>
													<p className="font-medium">Email Notifications</p>
													<p className="text-sm text-muted-foreground">
														Receive notifications via email
													</p>
												</div>
												<input
													type="checkbox"
													checked={settings?.emailNotifications ?? false}
													onChange={(e) =>
														updateSettings.mutate({ emailNotifications: e.target.checked })
													}
													className="w-5 h-5 accent-primary"
												/>
											</label>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Appearance Tab */}
						{activeTab === "appearance" && (
							<div className="space-y-6 animate-fade-in">
								<div className="rounded-2xl bg-card border border-border p-6 space-y-6">
									<h2 className="text-xl font-semibold">Appearance</h2>

									{settingsLoading ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 className="w-8 h-8 animate-spin text-primary" />
										</div>
									) : (
										<div className="space-y-4">
											<div>
												<Label className="mb-4 block">Theme</Label>
												<div className="grid grid-cols-3 gap-4">
													<button
														onClick={() => updateSettings.mutate({ theme: "dark" })}
														className={`p-4 rounded-xl border-2 ${
															settings?.theme === "dark" ? "border-primary" : "border-border"
														} bg-black text-center transition-colors`}
													>
														<div className="w-8 h-8 rounded-full bg-white/10 mx-auto mb-2" />
														<span className="text-sm text-white">Dark</span>
													</button>
													<button
														onClick={() => updateSettings.mutate({ theme: "light" })}
														className={`p-4 rounded-xl border-2 ${
															settings?.theme === "light" ? "border-primary" : "border-border"
														} bg-white text-gray-900 text-center transition-colors`}
													>
														<div className="w-8 h-8 rounded-full bg-gray-100 mx-auto mb-2" />
														<span className="text-sm">Light</span>
													</button>
													<button
														onClick={() => updateSettings.mutate({ theme: "system" })}
														className={`p-4 rounded-xl border-2 ${
															settings?.theme === "system" ? "border-primary" : "border-border"
														} text-center transition-colors`}
													>
														<div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-black mx-auto mb-2" />
														<span className="text-sm">System</span>
													</button>
												</div>
											</div>

											<div className="pt-4">
												<Label className="mb-4 block">Video Playback</Label>
												<label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
													<div>
														<p className="font-medium">Autoplay</p>
														<p className="text-sm text-muted-foreground">
															Automatically play videos when opened
														</p>
													</div>
													<input
														type="checkbox"
														checked={settings?.autoplay ?? true}
														onChange={(e) =>
															updateSettings.mutate({ autoplay: e.target.checked })
														}
														className="w-5 h-5 accent-primary"
													/>
												</label>
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
