import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Props = {
	title: string;
	children?: ReactNode;
	className?: string;
};

const PageHeader = ({ title, children, className }: Props) => {
	return (
		<div
			className={cn("mb-8 flex items-center gap-4 justify-between", className)}
		>
			<h1 className="text-2xl font-semibold">{title}</h1>
			{children && <div>{children}</div>}
		</div>
	);
};

export default PageHeader;
