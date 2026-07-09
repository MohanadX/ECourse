"use client";
import { ComponentPropsWithRef } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
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
import { LoadingTextSwap } from "./ActionButton";

type Props = {
	isLoading: boolean;
	performAction: () => void;
	buttonProps: Omit<ComponentPropsWithRef<typeof Button>, "onClick">;
};

export default function ActionConfirmDialog({
	isLoading,
	performAction,
	buttonProps,
}: Props) {
	return (
		<AlertDialog open={isLoading ? true : undefined}>
			<AlertDialogTrigger asChild>
				<Button
					{...buttonProps}
					className={cn("cursor-pointer", buttonProps.className)}
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
