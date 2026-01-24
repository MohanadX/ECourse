"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { ReactNode } from "react";

export default function ClerkProviderTheme({
	children,
}: {
	children: ReactNode;
}) {
	const { theme } = useTheme();

	return (
		<ClerkProvider
			appearance={{
				theme: theme === "dark" ? dark : "simple",
			}}
		>
			{children}
		</ClerkProvider>
	);
}
