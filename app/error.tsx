"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.log(error);
	}, [error]);

	return (
		<div className="absolute top-[50%] left-[50%] translate-[-50%] text-center">
			<h2 className="mb-3">Something went wrong!</h2>
			<button
				onClick={() => reset()}
				className="bg-primary hover:bg-primary/90 w-3xs cursor-pointer items-center justify-center rounded-[6px] px-4 py-2.5 text-lg font-semibold text-white dark:text-black"
			>
				Try Again
			</button>
		</div>
	);
}
