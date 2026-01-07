import { ReactNode, Suspense } from "react";

export default function EditLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return <Suspense fallback={<SkeletonLoader />}>{children}</Suspense>;
}

export function SkeletonLoader() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="w-full space-y-3">
				<div className="h-4 rounded-md bg-muted animate-pulse" />
				<div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
				<div className="h-4 w-4/6 rounded-md bg-muted animate-pulse" />
			</div>
		</div>
	);
}
