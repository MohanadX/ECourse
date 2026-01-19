import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "./ui/button";
import { getCurrentUser } from "@/features/users/db/clerk";
import UserButtonClient from "./UserButtonClient";
import SkeletonButton, { SkeletonArray } from "./Skeletons";

export default function Navbar() {
	return (
		<header className="h-12 shadow bg-background dark:bg-gray-700 relative z-50">
			<nav className="h-full flex flex-wrap items-center justify-between gap-4 containers px-4">
				<Link href={"/"} className="text-lg hover:underline pr-2">
					ECourse Educational Platform
				</Link>

				<input type="checkbox" id="main-nav-toggle" className="peer hidden" />
				<label
					htmlFor="main-nav-toggle"
					className="md:hidden p-2 cursor-pointer text-foreground"
					aria-label="Toggle Navbar menu"
					role="button"
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
					<Suspense
						fallback={
							<SkeletonArray amount={3}>
								<SkeletonButton className="size-16"></SkeletonButton>
							</SkeletonArray>
						}
					>
						<div className="flex h-full flex-col md:flex-row items-center w-full md:w-auto gap-2 md:gap-0">
							<SignedIn>
								{/* only be shown if the user signed in */}
								<AdminLink />
								<Link
									href={"/courses"}
									className="hover:bg-accent/10 dark:hover:bg-accent/25 flex justify-center items-center w-full md:w-auto md:h-full p-2 rounded md:rounded-none"
								>
									My Courses
								</Link>
								<Link
									href={"/purchases"}
									className="hover:bg-accent/10 flex justify-center dark:hover:bg-accent/25 items-center w-full md:w-auto md:h-full p-2 mr-2 rounded md:rounded-none"
								>
									Purchase History
								</Link>
								<div className="flex justify-center w-full md:w-auto p-2 md:p-0">
									<UserButtonClient />
								</div>
							</SignedIn>
						</div>
					</Suspense>
					<Suspense>
						<SignedOut>
							<Button className="self-center cursor-pointer" asChild>
								<SignInButton>Sign In</SignInButton>
							</Button>
						</SignedOut>
					</Suspense>
				</div>
			</nav>
		</header>
	);
}

async function AdminLink() {
	const user = await getCurrentUser({ allData: true });

	if (user.role !== "admin") {
		return null;
	}

	return (
		<Link
			href={`/admin/${user.userId}`}
			className="hover:bg-accent/10 dark:hover:bg-accent/25 flex justify-center items-center w-full md:w-auto md:h-full p-2 rounded md:rounded-none"
		>
			Admin
		</Link>
	);
}
