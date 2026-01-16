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
			<header className="h-12 shadow bg-background z-10">
				<nav className="h-full flex items-center justify-between gap-4 containers">
					<div>
						<Link href={"/"} className="text-lg hover:underline pr-2">
							ECourse Educational Platform
						</Link>
						<Badge>Admin</Badge>
					</div>
					<div className="flex items-center h-full">
						<SignedIn>
							{/* only be shown if the user signed in */}
							<Link
								href={`/admin/${userId}/courses`}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2"
							>
								Courses
							</Link>
							<Link
								href={`/admin/${userId}/products`}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2 mr-2"
							>
								Products
							</Link>
							<Link
								href={`/admin/${userId}/sales`}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2 mr-2"
							>
								Sales
							</Link>

							<UserButtonClient />
						</SignedIn>
					</div>
				</nav>
			</header>
			{children}
		</>
	);
}
