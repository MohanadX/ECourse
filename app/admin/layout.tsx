import { Badge } from "@/components/ui/badge";
import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
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
								href={"/admin/courses"}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2"
							>
								Courses
							</Link>
							<Link
								href={"/admin/products"}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2 mr-2"
							>
								Products
							</Link>
							<Link
								href={"/admin/sales"}
								className="hover:bg-accent/10  flex justify-center items-center h-full p-2 mr-2"
							>
								Sales
							</Link>
							<UserButton
								appearance={{
									elements: {
										userButtonAvatarBox: {
											width: "38px",
											height: "38px",
											boxShadow: "none",
										},
									},
								}}
							/>
						</SignedIn>
					</div>
				</nav>
			</header>
			{children}
		</>
	);
}
