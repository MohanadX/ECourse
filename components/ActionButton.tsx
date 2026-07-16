"use client";
import { ComponentPropsWithRef, ReactNode, useTransition } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";

const ActionConfirmDialog = dynamic(() => import("./ActionConfirmDialog"));


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
			const toastPr  = import("sonner");
			const {success, message} = await action();
			const {toast} = await toastPr
			if (success) {
				toast.success(message);

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
				toast.error(message);
			}
		});
	}

	if (requireAreYouSure) {
		return (
			<ActionConfirmDialog
				isLoading={isLoading}
				performAction={performAction}
				buttonProps={props}
			/>
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
