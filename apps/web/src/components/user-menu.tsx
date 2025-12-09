"use client";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
	User,
	Settings,
	LogOut,
	Film,
	Upload,
	Library,
	HelpCircle,
	HardDrive,
	Loader2,
} from "lucide-react";

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const { data: settings } = trpc.settings.get.useQuery(undefined, {
		enabled: !!session?.user,
	});

	if (isPending) {
		return (
			<div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
		);
	}

	if (!session?.user) {
		return null;
	}

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/");
					toast.success("Signed out successfully");
				},
			},
		});
	};

	const storagePercent = settings
		? Math.round((settings.storageUsed / settings.storageLimit) * 100)
		: 0;

	const menuItems = [
		{ href: "/library", label: "My Library", icon: Library },
		{ href: "/upload", label: "Upload Video", icon: Upload },
		{ href: "/settings", label: "Settings", icon: Settings },
	] as const;

	return (
		<div className="relative group">
			{/* Trigger */}
			<button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors">
				{session.user.image ? (
					<img
						src={session.user.image}
						alt={session.user.name ?? "User"}
						className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors"
					/>
				) : (
					<div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-colors">
						<span className="text-primary font-semibold text-sm">
							{session.user.name?.charAt(0).toUpperCase() || "U"}
						</span>
					</div>
				)}
			</button>

			{/* Dropdown */}
			<div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
				<div className="p-1 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl">
					{/* User Info */}
					<div className="p-4 border-b border-border">
						<div className="flex items-center gap-3">
							{session.user.image ? (
								<img
									src={session.user.image}
									alt={session.user.name ?? "User"}
									className="w-10 h-10 rounded-full object-cover"
								/>
							) : (
								<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
									<span className="text-primary font-bold text-lg">
										{session.user.name?.charAt(0).toUpperCase() || "U"}
									</span>
								</div>
							)}
							<div className="flex-1 min-w-0">
								<p className="font-semibold truncate">{session.user.name}</p>
								<p className="text-sm text-muted-foreground truncate">
									{session.user.email}
								</p>
							</div>
						</div>

						{/* Storage indicator */}
						<div className="mt-3 p-2 rounded-lg bg-muted/50">
							<div className="flex items-center justify-between text-xs mb-1">
								<span className="flex items-center gap-1 text-muted-foreground">
									<HardDrive className="w-3 h-3" />
									Storage
								</span>
								{settings ? (
									<span>{formatFileSize(settings.storageUsed)} used</span>
								) : (
									<Loader2 className="w-3 h-3 animate-spin" />
								)}
							</div>
							<div className="h-1.5 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-primary to-accent transition-all"
									style={{ width: `${storagePercent}%` }}
								/>
							</div>
						</div>
					</div>

					{/* Menu Items */}
					<div className="py-1">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted rounded-lg mx-1 transition-colors"
							>
								<item.icon className="w-4 h-4 text-muted-foreground" />
								{item.label}
							</Link>
						))}
					</div>

					{/* Sign Out */}
					<div className="p-1 border-t border-border">
						<button
							onClick={handleSignOut}
							className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
						>
							<LogOut className="w-4 h-4" />
							Sign Out
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
