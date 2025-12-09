import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
	display: "swap",
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "CineVault - Your Video Streaming Platform",
		template: "%s | CineVault",
	},
	description:
		"The open-source, self-hostable video streaming platform for creators, communities, and organizations. Netflix-quality streaming with zero platform fees.",
	keywords: [
		"video streaming",
		"open source",
		"self-hosted",
		"video platform",
		"creator tools",
		"content management",
	],
	authors: [{ name: "CineVault Team" }],
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://cinevault.io",
		siteName: "CineVault",
		title: "CineVault - Your Video Streaming Platform",
		description:
			"The open-source, self-hostable video streaming platform for creators, communities, and organizations.",
	},
	twitter: {
		card: "summary_large_image",
		title: "CineVault - Your Video Streaming Platform",
		description:
			"The open-source, self-hostable video streaming platform for creators, communities, and organizations.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="dark">
			<body
				suppressHydrationWarning
				className={`${outfit.variable} ${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
			>
				<Providers>
					<div className="flex flex-col min-h-screen">
						<Header />
						<main className="flex-1">{children}</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
