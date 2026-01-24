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
import { useQueryClient } from "@tanstack/react-query";

const ActionButton = ({
	action,
	requireAreYouSure = false,
	pagination,
	paginationArr,
	...props
}: Omit<ComponentPropsWithRef<typeof Button>, "onClick"> & {
	action: () => Promise<{ success: boolean; message: string }>;
	requireAreYouSure?: boolean;
	pagination?: [string, number] | [string];
	paginationArr?: string[];
}) => {
	const [isLoading, startTransition] = useTransition();

	const queryClient = useQueryClient();
	async function performAction() {
		startTransition(async () => {
			const data = await action();
			if (data.success) {
				toast.success(data.message);

				if (pagination) {
					queryClient.refetchQueries({
						queryKey: [...pagination],
					});
				} else if (paginationArr) {
					queryClient.refetchQueries({
						predicate: (query) =>
							paginationArr.includes(query.queryKey[0] as string),
					});
				}
			} else {
				toast.error(data.message);
			}
		});
	}

	if (requireAreYouSure) {
		return (
			<AlertDialog open={isLoading ? true : undefined}>
				<AlertDialogTrigger asChild>
					<Button
						{...props}
						className={cn("cursor-pointer", props.className)}
					></Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action is permanent and cannot be undone
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="cursor-pointer">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="cursor-pointer"
							disabled={isLoading}
							onClick={performAction}
						>
							<LoadingTextSwap isLoading={isLoading}>Yes</LoadingTextSwap>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	}
	return (
		<Button
			className="cursor-pointer"
			{...props}
			disabled={isLoading}
			onClick={performAction}
		>
			<LoadingTextSwap isLoading={isLoading}>{props.children}</LoadingTextSwap>
		</Button>
	);
};

export default ActionButton;

export function LoadingTextSwap({
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
					isLoading ? "invisible" : "visible",
				)}
			>
				{children}
			</div>
			<div
				className={cn(
					"col-start-1 col-end-2 row-start-1 row-end-2 text-center",
					isLoading ? "visible" : "invisible",
				)}
			>
				<Loader2Icon className="animate-spin" aria-label="Loading" />
			</div>
		</div>
	);
}
