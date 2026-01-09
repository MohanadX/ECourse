import { buttonVariants } from "./ui/button";

const SkeletonButton = ({ className }: { className?: string }) => {
	return (
		<div
			className={buttonVariants({
				variant: "secondary",
				className: `pointer-events-none animate-pulse ${className}`,
			})}
		></div>
	);
};

export default SkeletonButton;
