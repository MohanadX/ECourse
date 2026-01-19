import { Badge } from "@/components/ui/badge";
import UserButtonClient from "@/components/UserButtonClient";
import { getCurrentUser } from "@/features/users/db/clerk";
import { SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AdminLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	const { userId, redirectToSignIn } = await getCurrentUser();

	if (!userId) {
		return redirectToSignIn();
	}
	return (
		<>
			<header className="h-12 shadow bg-background dark:bg-gray-700 dark:border-b-white z-10 relative">
				<nav className="h-full flex flex-wrap items-center justify-between gap-4 containers mx-auto px-4">
					<div className="flex items-center h-full">
						<Link href={"/"} className="text-lg hover:underline  pr-2">
							ECourse Educational Platform
						</Link>
						<Badge>Admin</Badge>
					</div>

					<input
						type="checkbox"
						id="admin-nav-toggle"
						className="peer hidden"
					/>
					<label
						htmlFor="admin-nav-toggle"
						className="md:hidden cursor-pointer text-foreground"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-6 h-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							/>
						</svg>
					</label>

					<div className="flex absolute md:z-1 w-full md:flex md:w-auto md:h-full flex-col md:flex-row items-center md:static top-[-500px] peer-checked:top-12 transition-all left-0 bg-background md:bg-transparent shadow-md md:shadow-none p-4 md:p-0 gap-4 md:gap-0">
						<SignedIn>
							<Link
								href={`/admin/${userId}`}
								className="hover:bg-accent/10 dark:hover:bg-accent/25 flex justify-center items-center w-full md:w-auto md:h-full p-2 rounded md:rounded-none"
							>
								Admin Dashboard
							</Link>
							{/* only be shown if the user signed in */}
							<Link
								href={`/admin/${userId}/courses`}
								className="hover:bg-accent/10 flex dark:hover:bg-accent/25 justify-center items-center w-full md:w-auto md:h-full p-2 rounded md:rounded-none"
							>
								Courses
							</Link>
							<Link
								href={`/admin/${userId}/products`}
								className="hover:bg-accent/10 dark:hover:bg-accent/25 flex justify-center items-center w-full md:w-auto md:h-full p-2 mr-2 rounded md:rounded-none"
							>
								Products
							</Link>
							<Link
								href={`/admin/${userId}/sales`}
								className="hover:bg-accent/10 dark:hover:bg-accent/25 flex justify-center items-center w-full md:w-auto md:h-full p-2 mr-2 rounded md:rounded-none"
							>
								Sales
							</Link>
							<div className="flex justify-center w-full md:w-auto p-2 md:p-0">
								<UserButtonClient />
							</div>
						</SignedIn>
					</div>
				</nav>
			</header>
			{children}
		</>
	);
}
