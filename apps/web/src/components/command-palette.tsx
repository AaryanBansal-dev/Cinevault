"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import {
	Command,
	Search,
	Film,
	Upload,
	Settings,
	Home,
	Library,
	Play,
	Folder,
	Moon,
	Sun,
	LogOut,
	User,
	BarChart3,
	Clock,
	ArrowRight,
	Keyboard,
	X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";

interface CommandItem {
	id: string;
	title: string;
	icon: React.ReactNode;
	category: "navigation" | "actions" | "videos" | "settings";
	action: () => void;
	keywords?: string[];
}

export function CommandPalette() {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();

	// Fetch recent videos for quick access
	const { data: recentVideos } = trpc.video.getAll.useQuery(
		{ limit: 5, sortBy: "newest" },
		{ enabled: isOpen && !!session }
	);

	// Fetch folders
	const { data: folders } = trpc.folder.getAll.useQuery(undefined, {
		enabled: isOpen && !!session,
	});

	const close = useCallback(() => {
		setIsOpen(false);
		setSearch("");
		setSelectedIndex(0);
	}, []);

	// Keyboard shortcut to open
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd/Ctrl + K to open
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsOpen((prev) => !prev);
			}

			// Escape to close
			if (e.key === "Escape" && isOpen) {
				close();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, close]);

	// Generate command items
	const commands: CommandItem[] = useMemo(() => {
		const items: CommandItem[] = [
			// Navigation
			{
				id: "home",
				title: "Go to Home",
				icon: <Home className="w-4 h-4" />,
				category: "navigation",
				action: () => {
					router.push("/");
					close();
				},
				keywords: ["home", "main", "start"],
			},
			{
				id: "library",
				title: "Go to Library",
				icon: <Library className="w-4 h-4" />,
				category: "navigation",
				action: () => {
					router.push("/library");
					close();
				},
				keywords: ["library", "videos", "collection"],
			},
			{
				id: "upload",
				title: "Upload Video",
				icon: <Upload className="w-4 h-4" />,
				category: "actions",
				action: () => {
					router.push("/upload");
					close();
				},
				keywords: ["upload", "add", "new", "video"],
			},
			{
				id: "dashboard",
				title: "Dashboard",
				icon: <BarChart3 className="w-4 h-4" />,
				category: "navigation",
				action: () => {
					router.push("/dashboard");
					close();
				},
				keywords: ["dashboard", "stats", "analytics"],
			},
			{
				id: "settings",
				title: "Settings",
				icon: <Settings className="w-4 h-4" />,
				category: "settings",
				action: () => {
					router.push("/settings");
					close();
				},
				keywords: ["settings", "preferences", "options"],
			},
			// Actions
			{
				id: "toggle-theme",
				title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
				icon: theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
				category: "settings",
				action: () => {
					setTheme(theme === "dark" ? "light" : "dark");
					close();
				},
				keywords: ["theme", "dark", "light", "mode", "appearance"],
			},
		];

		// Add logout if logged in
		if (session) {
			items.push({
				id: "logout",
				title: "Sign Out",
				icon: <LogOut className="w-4 h-4" />,
				category: "actions",
				action: async () => {
					await authClient.signOut();
					router.push("/");
					close();
				},
				keywords: ["logout", "sign out", "exit"],
			});
		}

		// Add recent videos
		if (recentVideos) {
			recentVideos.forEach((video) => {
				items.push({
					id: `video-${video.id}`,
					title: video.title,
					icon: <Play className="w-4 h-4" />,
					category: "videos",
					action: () => {
						router.push(`/watch/${video.id}`);
						close();
					},
					keywords: [video.title.toLowerCase()],
				});
			});
		}

		// Add folders
		if (folders) {
			folders.forEach((folder) => {
				items.push({
					id: `folder-${folder.id}`,
					title: `Open folder: ${folder.name}`,
					icon: <Folder className="w-4 h-4" />,
					category: "navigation",
					action: () => {
						router.push(`/library?folder=${folder.id}`);
						close();
					},
					keywords: [folder.name.toLowerCase(), "folder"],
				});
			});
		}

		return items;
	}, [router, close, theme, setTheme, session, recentVideos, folders]);

	// Filter commands based on search
	const filteredCommands = useMemo(() => {
		if (!search.trim()) return commands;

		const query = search.toLowerCase();
		return commands.filter((cmd) => {
			const titleMatch = cmd.title.toLowerCase().includes(query);
			const keywordMatch = cmd.keywords?.some((kw) => kw.includes(query));
			return titleMatch || keywordMatch;
		});
	}, [commands, search]);

	// Group filtered commands by category
	const groupedCommands = useMemo(() => {
		const groups: Record<string, CommandItem[]> = {
			navigation: [],
			actions: [],
			videos: [],
			settings: [],
		};

		filteredCommands.forEach((cmd) => {
			groups[cmd.category].push(cmd);
		});

		return groups;
	}, [filteredCommands]);

	// Handle keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : 0
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredCommands.length - 1
				);
			} else if (e.key === "Enter") {
				e.preventDefault();
				filteredCommands[selectedIndex]?.action();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, filteredCommands, selectedIndex]);

	// Reset selection when search changes
	useEffect(() => {
		setSelectedIndex(0);
	}, [search]);

	if (!isOpen) return null;

	let currentIndex = 0;

	const renderCategory = (title: string, items: CommandItem[]) => {
		if (items.length === 0) return null;

		return (
			<div key={title}>
				<div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
					{title}
				</div>
				{items.map((cmd) => {
					const index = currentIndex++;
					return (
						<button
							key={cmd.id}
							onClick={cmd.action}
							className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
								index === selectedIndex
									? "bg-primary/10 text-primary"
									: "hover:bg-muted"
							}`}
						>
							<span className="text-muted-foreground">{cmd.icon}</span>
							<span className="flex-1">{cmd.title}</span>
							{index === selectedIndex && (
								<ArrowRight className="w-4 h-4 text-muted-foreground" />
							)}
						</button>
					);
				})}
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
				onClick={close}
			/>

			{/* Command Panel */}
			<div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl animate-in slide-in-from-top-4 duration-200">
				<div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden mx-4">
					{/* Search Input */}
					<div className="flex items-center gap-3 px-4 py-4 border-b border-border">
						<Search className="w-5 h-5 text-muted-foreground" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search commands, videos, folders..."
							className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
							autoFocus
						/>
						<div className="flex items-center gap-1.5">
							<kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">
								ESC
							</kbd>
						</div>
					</div>

					{/* Results */}
					<div className="max-h-[60vh] overflow-y-auto">
						{filteredCommands.length === 0 ? (
							<div className="py-12 text-center text-muted-foreground">
								<Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
								<p>No results found for "{search}"</p>
							</div>
						) : (
							<>
								{renderCategory("Navigation", groupedCommands.navigation)}
								{renderCategory("Actions", groupedCommands.actions)}
								{renderCategory("Recent Videos", groupedCommands.videos)}
								{renderCategory("Settings", groupedCommands.settings)}
							</>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
						<div className="flex items-center gap-4">
							<span className="flex items-center gap-1">
								<kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↑↓</kbd>
								<span>Navigate</span>
							</span>
							<span className="flex items-center gap-1">
								<kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↵</kbd>
								<span>Open</span>
							</span>
						</div>
						<span className="flex items-center gap-1">
							<Keyboard className="w-3 h-3" />
							<span>⌘K to toggle</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
