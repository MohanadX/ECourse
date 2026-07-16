"use client";
import { ReactNode, useEffect, useEffectEvent, useId, useOptimistic, useRef, useState, useTransition } from "react";
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
				items.some((item, index) => item.id !== sortableItems[index]?.id
				|| item.name !== sortableItems[index]?.name 
				|| item.status !== sortableItems[index]?.status)){
				latestRequestId.current += 1; 
				/** If the items prop changes from the outside while an asynchronous drag-and-drop network request is still pending,
				 * your component's internal state syncs up, but the pending request is not aborted or marked stale. */
				setSortableItems(items)
				startTransition(() => setOptimisticItems(items));
			}
		}) // useEffectEvent to make useEffect not reactive to sortableItems (without invoking eslint warning of lost item in dependency array)

	// to track concurrent reorder requests (if next reorder-request resolves before previous one we discard the old one)	
	const latestRequestId = useRef(0);
	useEffect(() => {
		syncStates(items);
	}, [items]);
	function getNewArray(array: T[], activeId: string, overId: string) {
		const oldIndex = array.findIndex((section) => section.id === activeId);
		const newIndex = array.findIndex((section) => section.id === overId);
		return arrayMove(array, oldIndex, newIndex);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const activeId = active.id.toString();
		const overId = over?.id.toString();

		if (!activeId || !overId) return;

		// one for id for this request closure and other for the general lifecycle of requests
		const currentRequestId = latestRequestId.current + 1;
		latestRequestId.current = currentRequestId;

		// Snapshot the currently committed state at the beginning of the drag
		const rollbackSnapshot = sortableItems;
		const newOrderItems = getNewArray(optimisticItems, activeId, overId);
		startTransition(async () => {

			const  toastPr  =  import("sonner");

			try {
				setOptimisticItems(newOrderItems);
				const actionData = await onOrderChangeAction(
					newOrderItems.map((item) => item.id),
				);

				const {toast} = await toastPr
				// we discard this response. The newer request will settle the UI.
				if (currentRequestId !== latestRequestId.current) {
					return; 
				}

				if (actionData.success) {
					toast.success(actionData.message);
					setSortableItems(newOrderItems)
				} else {
					toast.error(actionData.message);
					setSortableItems(rollbackSnapshot)
				}
			} catch (error) {
				console.error(error)
				// Prevent stale failure blocks from overriding newer active drags
                if (currentRequestId !== latestRequestId.current) return;

                const { toast } = await toastPr;
                toast.error("Network connection issue. Reverting order.");
                // Safe rollback on true network failures (e.g., offline)
                setSortableItems(rollbackSnapshot);
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
