"use client";
import { ComponentPropsWithRef, ReactNode, useTransition } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
	AlertDialogFooter,
	AlertDialogHeader,
} from "./ui/alert-dialog";

const ActionButton = ({
	action,
	requireAreYouSure = false,
	...props
}: Omit<ComponentPropsWithRef<typeof Button>, "onClick"> & {
	action: () => Promise<{ success: boolean; message: string }>;
	requireAreYouSure?: boolean;
}) => {
	const [isLoading, startTransition] = useTransition();

	async function performAction() {
		startTransition(async () => {
			const data = await action();
			if (data.success) {
				toast.success(data.message);
			} else {
				toast.error(data.message);
			}
		});
	}

	if (requireAreYouSure) {
		return (
			<AlertDialog open={isLoading ? true : undefined}>
				<AlertDialogTrigger asChild>
					<Button {...props}></Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action is permanent and cannot be undone
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="hover:text-white">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction disabled={isLoading} onClick={performAction}>
							<LoadingTextSwap isLoading={isLoading}>Yes</LoadingTextSwap>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	}
	return (
		<Button {...props} disabled={isLoading} onClick={performAction}>
			<LoadingTextSwap isLoading={isLoading}>{props.children}</LoadingTextSwap>
		</Button>
	);
};

export default ActionButton;

function LoadingTextSwap({
	isLoading,
	children,
}: {
	isLoading: boolean;
	children: ReactNode;
}) {
	return (
		<div className="grid items-center justify-items-center">
			<div
				className={cn(
					"col-start-1 col-end-2 row-start-1 row-end-2", // to make them occupy the same space
					isLoading ? "invisible" : "visible"
				)}
			>
				{children}
			</div>
			<div
				className={cn(
					"col-start-1 col-end-2 row-start-1 row-end-2 text-center",
					isLoading ? "visible" : "invisible"
				)}
			>
				<Loader2Icon className="animate-spin" />
			</div>
		</div>
	);
}
