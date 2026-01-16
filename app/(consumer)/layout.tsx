import Navbar from "@/components/Navbar";
import { ReactNode, Suspense } from "react";
import PageLoader from "../loading";

export default function CustomerLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<>
			<Navbar />
			<Suspense fallback={<PageLoader className="min-h-[90vh]" />}>
				{children}
			</Suspense>
		</>
	);
}
