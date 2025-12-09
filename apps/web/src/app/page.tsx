"use client";

import { Play, Upload, Shield, Zap, ChevronRight, Server, Lock, Folder, Film, HardDrive, Cloud } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const features = [
	{
		icon: HardDrive,
		title: "Your Media, Your Server",
		description: "Host your personal video collection. Full control over your content and data.",
	},
	{
		icon: Lock,
		title: "Private & Secure",
		description: "Your videos stay private. No tracking, no ads, no data mining.",
	},
	{
		icon: Film,
		title: "4K Streaming",
		description: "Crystal clear playback with adaptive bitrate for any device.",
	},
	{
		icon: Cloud,
		title: "Access Anywhere",
		description: "Stream your library from any device, anywhere in the world.",
	},
];

const useCases = [
	{
		title: "Home Media Server",
		description: "Organize and stream your personal movie and video collection to all your devices.",
		icon: Server,
	},
	{
		title: "Family Videos",
		description: "Keep precious memories safe and accessible. Share with family members only.",
		icon: Folder,
	},
	{
		title: "Content Creators",
		description: "Private storage and review system for your video projects before publishing.",
		icon: Film,
	},
];

export default function Home() {
	const { data: session } = authClient.useSession();

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="relative min-h-[85vh] flex items-center overflow-hidden">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.65_0.25_285/0.15),transparent_50%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,oklch(0.75_0.15_190/0.1),transparent_50%)]" />

				{/* Content */}
				<div className="relative z-10 container mx-auto px-6 py-20">
					<div className="max-w-3xl mx-auto text-center space-y-8">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-fade-in">
							<Server className="w-4 h-4 text-primary" />
							<span className="text-sm font-medium">Self-Hosted Media Server</span>
						</div>

						{/* Title */}
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
							Your Personal
							<br />
							<span className="gradient-text">Video Library</span>
						</h1>

						{/* Description */}
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-delay-1">
							CineVault is your private, self-hosted video streaming platform. 
							Upload, organize, and stream your personal video collection from anywhere.
						</p>

						{/* CTAs */}
						<div className="flex flex-wrap justify-center gap-4 pt-4 animate-fade-in-delay-2">
							{session?.user ? (
								<>
									<Button size="lg" asChild className="btn-shine glow-primary text-lg px-8 py-6">
										<Link href="/library">
											<Film className="w-5 h-5 mr-2" />
											My Library
										</Link>
									</Button>
									<Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6 glass">
										<Link href="/upload">
											<Upload className="w-5 h-5 mr-2" />
											Upload Videos
										</Link>
									</Button>
								</>
							) : (
								<>
									<Button size="lg" asChild className="btn-shine glow-primary text-lg px-8 py-6">
										<Link href="/login">
											Get Started
											<ChevronRight className="w-5 h-5 ml-2" />
										</Link>
									</Button>
									<Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6 glass">
										<Link href="/login">
											Sign In
										</Link>
									</Button>
								</>
							)}
						</div>

						{/* Trust badges */}
						<div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground animate-fade-in-delay-3">
							<div className="flex items-center gap-2">
								<Shield className="w-4 h-4 text-green-500" />
								<span>100% Private</span>
							</div>
							<div className="flex items-center gap-2">
								<Lock className="w-4 h-4 text-green-500" />
								<span>Your Data, Your Control</span>
							</div>
							<div className="flex items-center gap-2">
								<Server className="w-4 h-4 text-green-500" />
								<span>Self-Hosted</span>
							</div>
						</div>
					</div>
				</div>

				{/* Scroll indicator */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
					<div className="w-6 h-10 rounded-full border-2 border-muted-foreground flex justify-center pt-2">
						<div className="w-1 h-2 bg-muted-foreground rounded-full" />
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 px-6">
				<div className="container mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Why Choose <span className="gradient-text">CineVault</span>?
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							The open-source, self-hosted video platform that puts you in complete control
							of your personal media library.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{features.map((feature, index) => (
							<div
								key={feature.title}
								className="card-hover group p-6 rounded-2xl glass text-center"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								<div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
									<feature.icon className="w-8 h-8" />
								</div>
								<h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
								<p className="text-sm text-muted-foreground">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Use Cases Section */}
			<section className="py-20 px-6 bg-card/30">
				<div className="container mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Perfect For
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							CineVault adapts to your needs, whether you're organizing home videos 
							or managing a professional media archive.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{useCases.map((useCase, index) => (
							<div
								key={useCase.title}
								className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
							>
								<div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
									<useCase.icon className="w-6 h-6 text-primary" />
								</div>
								<h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
								<p className="text-muted-foreground">{useCase.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-6">
				<div className="container mx-auto">
					<div className="relative overflow-hidden rounded-3xl p-8 md:p-16 text-center">
						{/* Gradient background */}
						<div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5" />
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.65_0.25_285/0.3),transparent_50%)]" />
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,oklch(0.75_0.15_190/0.2),transparent_50%)]" />

						<div className="relative z-10">
							<h2 className="text-3xl md:text-5xl font-bold mb-4">
								Start Building Your Library
							</h2>
							<p className="text-muted-foreground max-w-xl mx-auto mb-8">
								Create your account and start uploading your personal video collection today.
								Your media, your rules, your server.
							</p>
							<div className="flex flex-wrap justify-center gap-4">
								{session?.user ? (
									<Button size="lg" asChild className="btn-shine glow-primary text-lg px-8 py-6">
										<Link href="/upload">
											<Upload className="w-5 h-5 mr-2" />
											Upload Your First Video
										</Link>
									</Button>
								) : (
									<Button size="lg" asChild className="btn-shine glow-primary text-lg px-8 py-6">
										<Link href="/login">
											Create Free Account
											<ChevronRight className="w-5 h-5 ml-2" />
										</Link>
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-12 px-6">
				<div className="container mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-2">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
								<Film className="w-5 h-5 text-white" />
							</div>
							<span className="text-xl font-bold gradient-text">CineVault</span>
						</div>
						<p className="text-sm text-muted-foreground text-center">
							© 2024 CineVault. Open source under MIT License. Your personal media server.
						</p>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<a href="https://github.com" className="hover:text-foreground transition-colors">
								GitHub
							</a>
							<a href="#" className="hover:text-foreground transition-colors">
								Documentation
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
