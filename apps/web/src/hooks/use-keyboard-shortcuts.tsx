"use client";

import { useEffect, useCallback, useState } from "react";
import { toast } from "sonner";

interface KeyboardShortcuts {
	[key: string]: {
		description: string;
		action: () => void;
	};
}

interface UseKeyboardShortcutsOptions {
	enabled?: boolean;
	showToast?: boolean;
}

export function useKeyboardShortcuts(
	shortcuts: KeyboardShortcuts,
	options: UseKeyboardShortcutsOptions = {}
) {
	const { enabled = true, showToast = false } = options;

	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if user is typing in an input
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			// Build key identifier
			let key = "";
			if (e.metaKey) key += "meta+";
			if (e.ctrlKey) key += "ctrl+";
			if (e.shiftKey) key += "shift+";
			if (e.altKey) key += "alt+";
			key += e.key.toLowerCase();

			const shortcut = shortcuts[key];
			if (shortcut) {
				e.preventDefault();
				shortcut.action();
				if (showToast) {
					toast.info(shortcut.description);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts, enabled, showToast]);
}

// Video Player Keyboard Shortcuts
export function useVideoPlayerShortcuts(
	videoRef: React.RefObject<HTMLVideoElement | null>,
	options?: {
		onToggleFullscreen?: () => void;
		onToggleMute?: () => void;
		onTogglePlay?: () => void;
	}
) {
	const [showShortcutHint, setShowShortcutHint] = useState<string | null>(null);

	const showHint = useCallback((hint: string) => {
		setShowShortcutHint(hint);
		setTimeout(() => setShowShortcutHint(null), 1000);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const video = videoRef.current;
			if (!video) return;

			// Don't trigger if user is typing in an input
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			switch (e.key.toLowerCase()) {
				// Play/Pause
				case " ":
				case "k":
					e.preventDefault();
					if (video.paused) {
						video.play();
						showHint("▶ Play");
					} else {
						video.pause();
						showHint("⏸ Pause");
					}
					options?.onTogglePlay?.();
					break;

				// Seek backward 5s (with shift)
				case "arrowleft":
					e.preventDefault();
					if (e.shiftKey) {
						video.currentTime = Math.max(0, video.currentTime - 5);
						showHint("⏪ -5s");
					} else {
						video.currentTime = Math.max(0, video.currentTime - 10);
						showHint("⏪ -10s");
					}
					break;

				// Seek forward (with shift for 5s)
				case "arrowright":
					e.preventDefault();
					if (e.shiftKey) {
						video.currentTime = Math.min(video.duration, video.currentTime + 5);
						showHint("⏩ +5s");
					} else {
						video.currentTime = Math.min(video.duration, video.currentTime + 10);
						showHint("⏩ +10s");
					}
					break;

				// Volume up
				case "arrowup":
					e.preventDefault();
					video.volume = Math.min(1, video.volume + 0.1);
					showHint(`🔊 ${Math.round(video.volume * 100)}%`);
					break;

				// Volume down
				case "arrowdown":
					e.preventDefault();
					video.volume = Math.max(0, video.volume - 0.1);
					showHint(`🔈 ${Math.round(video.volume * 100)}%`);
					break;

				// Mute
				case "m":
					e.preventDefault();
					video.muted = !video.muted;
					showHint(video.muted ? "🔇 Muted" : "🔊 Unmuted");
					options?.onToggleMute?.();
					break;

				// Fullscreen
				case "f":
					e.preventDefault();
					options?.onToggleFullscreen?.();
					break;

				// Jump to beginning
				case "home":
				case "0":
					e.preventDefault();
					video.currentTime = 0;
					showHint("⏮ Start");
					break;

				// Jump to end
				case "end":
					e.preventDefault();
					video.currentTime = video.duration;
					showHint("⏭ End");
					break;

				// Jump to percentage (1-9)
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
				case "6":
				case "7":
				case "8":
				case "9":
					e.preventDefault();
					const percent = parseInt(e.key) * 10;
					video.currentTime = (video.duration * percent) / 100;
					showHint(`⏩ ${percent}%`);
					break;

				// Playback speed
				case "<":
				case ",":
					e.preventDefault();
					video.playbackRate = Math.max(0.25, video.playbackRate - 0.25);
					showHint(`⚡ ${video.playbackRate}x`);
					break;

				case ">":
				case ".":
					e.preventDefault();
					video.playbackRate = Math.min(4, video.playbackRate + 0.25);
					showHint(`⚡ ${video.playbackRate}x`);
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [videoRef, options, showHint]);

	return { showShortcutHint };
}

// Keyboard Shortcuts Modal/Overlay
export function KeyboardShortcutsGuide() {
	const shortcuts = [
		{ category: "Playback", shortcuts: [
			{ key: "Space / K", action: "Play / Pause" },
			{ key: "J / ←", action: "Seek back 10 seconds" },
			{ key: "L / →", action: "Seek forward 10 seconds" },
			{ key: "0-9", action: "Jump to 0% - 90%" },
			{ key: "Home / 0", action: "Jump to start" },
			{ key: "End", action: "Jump to end" },
		]},
		{ category: "Volume", shortcuts: [
			{ key: "↑", action: "Volume up" },
			{ key: "↓", action: "Volume down" },
			{ key: "M", action: "Mute / Unmute" },
		]},
		{ category: "Speed", shortcuts: [
			{ key: "< / ,", action: "Decrease speed" },
			{ key: "> / .", action: "Increase speed" },
		]},
		{ category: "Display", shortcuts: [
			{ key: "F", action: "Fullscreen" },
			{ key: "⌘K / Ctrl+K", action: "Command Palette" },
		]},
	];

	return (
		<div className="p-6">
			<h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
			<div className="grid md:grid-cols-2 gap-6">
				{shortcuts.map((category) => (
					<div key={category.category}>
						<h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
							{category.category}
						</h4>
						<div className="space-y-2">
							{category.shortcuts.map((shortcut) => (
								<div
									key={shortcut.key}
									className="flex items-center justify-between py-1.5"
								>
									<kbd className="px-2 py-1 bg-muted rounded border border-border text-sm font-mono">
										{shortcut.key}
									</kbd>
									<span className="text-sm text-muted-foreground">
										{shortcut.action}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
