import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "./ui/button";
import { getCurrentUser } from "@/features/users/db/clerk";
import UserButtonClient from "./UserButtonClient";

export default function Navbar() {
	return (
		<header className="h-12 shadow bg-background z-10">
			<nav className="h-full flex items-center justify-between gap-4 containers">
				<Link href={"/"} className="text-lg hover:underline pr-2">
					ECourse Educational Platform
				</Link>
				<Suspense>
					<div className="flex items-center h-full">
						<SignedIn>
							{/* only be shown if the user signed in */}
							<AdminLink />
							<Link
								href={"/courses"}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2"
							>
								My Courses
							</Link>
							<Link
								href={"/purchases"}
								className="hover:bg-accent/10 flex justify-center items-center h-full p-2 mr-2"
							>
								Purchase History
							</Link>
							<UserButtonClient />
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
			</nav>
		</header>
	);
}

async function AdminLink() {
	const user = await getCurrentUser({ allData: true });
	console.log(user.user?.name);

	if (user.role !== "admin") {
		return null;
	}

	return (
		<Link
			href={"/admin"}
			className="hover:bg-accent/10  flex justify-center items-center h-full p-2"
		>
			Admin
		</Link>
	);
}
