"use client";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

import dynamic from "next/dynamic";

const UserButton = dynamic(
	async () => (await import("@clerk/nextjs")).UserButton,
	{
		ssr: false,
		loading: () => (
			<span className="w-[38px] h-[38px] bg-gray-200 animate-pulse rounded-full"></span>
		),
	},
);

export default function UserButtonClient() {
	const { theme } = useTheme();
	return (
		<UserButton
			appearance={{
				theme: theme === "dark" ? dark : "simple",
				elements: {
					userButtonAvatarBox: {
						width: "38px",
						height: "38px",
						boxShadow: "none",
					},
				},
			}}
		/>
	);
}
