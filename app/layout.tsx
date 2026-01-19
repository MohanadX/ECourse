import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { ModeToggle } from "@/components/ui/toggle-theme";
import { env } from "@/data/env/server";
const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster));
export const metadata: Metadata = {
	metadataBase: env.SERVER_URL,
	title: "ECourse Platform",
	description: `ECourse is a modern, full-stack Learning Management System (LMS) built with Next.js 16 and a scalable, production-ready architecture.  
				It provides secure authentication, course management, payments, subscriptions, coupon handling, and optimized media delivery — all designed for real-world educational platforms.`,
	keywords: [
		"developer events",
		"tech conferences",
		"developer meetups",
		"Lorial",
		"software community",
		"frontend",
		"AI",
		"DevOps",
		"Kubernetes",
	],
	openGraph: {
		title: "ECourse – Modern Learning Management System",
		description:
			"Create, manage, and sell online courses with ECourse. A modern LMS built for educators, students, and institutions.",
		images: ["/icons/ecourse.png"],
		siteName: "ECourse",
		url: env.SERVER_URL,
		type: "website",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-snippet": -1,
			"max-image-preview": "large",
			"max-video-preview": -1,
		},
	},
	other: {
		"application/ld+json": JSON.stringify({
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: "ECourse",
			url: env.SERVER_URL,
			description:
				"ECourse is a modern Learning Management System for online education, course creation, and digital learning experiences.",
			publisher: {
				"@type": "Organization",
				name: "ECourse",
				logo: {
					"@type": "ImageObject",
					url: `${env.SERVER_URL}/icons/ecourse.png`,
				},
			},
		}),
	},
	twitter: {
		card: "summary_large_image",
		site: "@ecourse", // update if you have an official handle
		creator: "@ecourse",
		title: "ECourse – Modern Learning Management System",
		description:
			"Build and scale your online courses with ECourse. A powerful LMS for educators and learners.",
		images: ["/icons/ecourse.png"], // 1200x628 recommended
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`antialiased`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Suspense>
						<ClerkProvider>
							<div className="fixed z-100">
								<ModeToggle />
							</div>
							{children}
						</ClerkProvider>
					</Suspense>
					<Toaster
						visibleToasts={1}
						richColors
						closeButton
						duration={4000}
						position="bottom-right"
						toastOptions={{
							classNames: {
								default:
									"bg-white text-black border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 shadow-lg",
								success:
									"bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700 shadow-lg",
								error:
									"bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700 shadow-lg",
								info: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 shadow-lg",
								warning:
									"bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700 shadow-lg",
							},
						}}
					/>
				</ThemeProvider>
			</body>
		</html>
	);
}
