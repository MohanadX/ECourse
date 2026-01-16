"use client";

export default function PurchaseError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="container mx-auto p-8 text-center">
			<h2 className="text-2xl font-bold text-red-600 mb-4">
				Something went wrong!
			</h2>
			<p className="text-gray-600 mb-4">{error.message}</p>
			<button
				onClick={reset}
				className="px-4 py-2 bg-blue-600 text-white rounded"
			>
				Try again
			</button>
		</div>
	);
}
