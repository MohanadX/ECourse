import Navbar from "@/components/Navbar";
import { ReactNode } from "react";

export default function CustomerLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<>
			<Navbar />
			{children}
		</>
	);
}
