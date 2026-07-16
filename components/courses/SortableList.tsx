"use client";
import { ReactNode, useEffect, useEffectEvent, useId, useOptimistic, useState, useTransition } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVerticalIcon } from "lucide-react";


export function SortableList<T extends { id: string, name: string, status?: string}>({
	items,
	onOrderChangeAction,
	children,
}: {
	items: T[];
	onOrderChangeAction: (
		newOrder: string[],
	) => Promise<{ success: boolean; message: string }>;
	children: (items: T[]) => ReactNode;
}) {
	const DndContextId = useId(); // to distinguish it from other DndContexts (other draggable tables)
	const [sortableItems, setSortableItems] = useState(items);
	const [optimisticItems, setOptimisticItems] = useOptimistic(sortableItems);
	const [, startTransition] = useTransition();
	// props and states are not always in sync. When props changes, state is not updated automatically
	const syncStates = useEffectEvent((items: T[])=>{
			// if name or status changed - sync states
			if (items.length !== sortableItems.length || 
				items.some((item, index) => item.name !== sortableItems[index]?.name || item.status !== sortableItems[index]?.status)){
				setSortableItems(items)
				startTransition(() => setOptimisticItems(items));
			}
		}) // useEffectEvent to make useEffect not reactive to sortableItems (without invoking eslint warning of lost item in dependency array)


	useEffect(() => {
		syncStates(items);
	}, [items]);
	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const activeId = active.id.toString();
		const overId = over?.id.toString();

		if (!activeId || !overId) return;

		function getNewArray(array: T[], activeId: string, overId: string) {
			const oldIndex = array.findIndex((section) => section.id === activeId);
			const newIndex = array.findIndex((section) => section.id === overId);
			return arrayMove(array, oldIndex, newIndex);
		}

		startTransition(async () => {
			const newOrderItems = getNewArray(optimisticItems, activeId, overId);
			const  toastPr  =  import("sonner");
			setOptimisticItems(newOrderItems);
			const actionData = await onOrderChangeAction(
				newOrderItems.map((item) => item.id),
			);
			const {toast} = await toastPr

			if (actionData.success) {
				toast.success(actionData.message);
				setSortableItems(newOrderItems)
			} else {
				toast.error(actionData.message);
			}
		});
	}
	return (
		<DndContext id={DndContextId} onDragEnd={handleDragEnd}>
			<SortableContext
				items={optimisticItems}
				strategy={verticalListSortingStrategy}
			>
				<div className="flex flex-col gap-2">{children(optimisticItems)}</div>
			</SortableContext>
		</DndContext>
	);
}

export function SortableItem({
	id,
	children,
	className,
}: {
	id: string;
	children: ReactNode;
	className?: string;
}) {
	const {
		setNodeRef,
		transform,
		transition,
		activeIndex,
		index,
		attributes,
		listeners,
	} = useSortable({ id });
	const isActive = activeIndex === index;

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={cn(
				"flex gap-1 items-center bg-background rounded-lg p-2",
				isActive && "z-10 border shadow-md",
			)}
		>
			<GripVerticalIcon
				className="text-muted-foreground size-6 p-1"
				{...attributes}
				{...listeners}
			/>
			<div className={cn("grow", className)}>{children}</div>
		</div>
	);
}
