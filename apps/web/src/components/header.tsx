"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { 
	Film, 
	Search, 
	Upload, 
	Menu,
	X,
	Home,
	Library,
	Settings,
	FolderOpen,
	ListMusic,
	Heart,
	Command,
} from "lucide-react";
import { useState } from "react";

const navLinks = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/library", label: "My Library", icon: Library },
	{ href: "/playlists", label: "Playlists", icon: ListMusic },
	{ href: "/favorites", label: "Favorites", icon: Heart },
	{ href: "/upload", label: "Upload", icon: Upload },
] as const;

export default function Header() {
	const pathname = usePathname();
	const { data: session } = authClient.useSession();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 glass border-b border-border">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2 shrink-0">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
							<Film className="w-5 h-5 text-white" />
						</div>
						<span className="text-xl font-bold gradient-text hidden sm:block">
							CineVault
						</span>
					</Link>

					{/* Desktop Navigation */}
					{session?.user && (
						<nav className="hidden md:flex items-center gap-1">
							{navLinks.map((link) => {
								const isActive = pathname === link.href;
								return (
									<Link
										key={link.href}
										href={link.href}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
											isActive
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:text-foreground hover:bg-muted"
										}`}
									>
										<link.icon className="w-4 h-4" />
										<span className="text-sm font-medium">{link.label}</span>
									</Link>
								);
							})}
						</nav>
					)}

					{/* Right Actions */}
					<div className="flex items-center gap-2">
						{/* Search - Only for logged in users */}
						{session?.user && (
							<>
								{searchOpen ? (
									<div className="relative animate-fade-in">
										<input
											type="text"
											placeholder="Search your library..."
											className="w-64 px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
											autoFocus
											onBlur={() => setSearchOpen(false)}
										/>
									</div>
								) : (
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setSearchOpen(true)}
										className="text-muted-foreground hover:text-foreground"
									>
										<Search className="w-5 h-5" />
									</Button>
								)}
							</>
						)}

						<ModeToggle />
						
						{session?.user ? (
							<UserMenu />
						) : (
							<Button asChild size="sm" className="btn-shine">
								<Link href="/login">Sign In</Link>
							</Button>
						)}

						{/* Mobile Menu Toggle */}
						{session?.user && (
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden"
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							>
								{mobileMenuOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && session?.user && (
				<div className="md:hidden border-t border-border animate-fade-in">
					<nav className="container mx-auto px-4 py-4 space-y-2">
						{navLinks.map((link) => {
							const isActive = pathname === link.href;
							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMobileMenuOpen(false)}
									className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
										isActive
											? "bg-primary/10 text-primary"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									}`}
								>
									<link.icon className="w-5 h-5" />
									<span className="font-medium">{link.label}</span>
								</Link>
							);
						})}
						<div className="h-px bg-border my-2" />
						<Link
							href="/settings"
							onClick={() => setMobileMenuOpen(false)}
							className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
						>
							<Settings className="w-5 h-5" />
							<span className="font-medium">Settings</span>
						</Link>
					</nav>
				</div>
			)}
		</header>
	);
}
