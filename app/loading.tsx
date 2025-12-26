export default function PageLoader() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div
				role="status"
				aria-label="Loading"
				className="flex flex-col items-center gap-4"
			>
				{/* Spinner */}
				<div className="relative h-16 w-16">
					<div className="absolute inset-0 rounded-full border-4 border-border opacity-30" />
					<div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
					<div className="absolute inset-2 rounded-full border-4 border-transparent border-t-accent animate-spin-slow" />
				</div>

				{/* Text */}
				<p className="text-sm font-medium text-muted-foreground tracking-wide">
					Loading…
				</p>
			</div>
		</div>
	);
}
