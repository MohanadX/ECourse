"use client";

import { CourseSectionStatus } from "@/drizzle/schema";
import { SortableItem, SortableList } from "./SortableList";
import { cn } from "@/lib/utils";
import { EyeClosed, Trash2Icon } from "lucide-react";
import SectionFormDialog from "./SectionFormDialog";
import { DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import ActionButton from "../ActionButton";
import { deleteSection, mutateSectionOrders } from "@/features/actions/section";

export default function SortableSectionList({
	courseId,
	sections,
}: {
	courseId: string;
	sections: {
		id: string;
		name: string;
		status: CourseSectionStatus;
	}[];
}) {
	return (
		<SortableList items={sections} onOrderChangeAction={mutateSectionOrders}>
			{(
				items, // function as child pattern
			) =>
				items.map((section) => (
					<SortableItem
						key={section.id}
						id={section.id}
						className="flex items-center gap-1"
					>
						<p
							className={cn(
								"contents",
								section.status === "private" && "text-muted-foreground",
							)}
						>
							{section.status === "private" && <EyeClosed className="size-4" />}
							{section.name}
						</p>
						<div className="ml-auto flex items-center gap-2">
							<SectionFormDialog section={section} courseId={courseId}>
								<DialogTrigger asChild>
									<Button
										className="cursor-pointer"
										variant={"outline"}
										size={"sm"}
									>
										Edit
									</Button>
								</DialogTrigger>
							</SectionFormDialog>
							<ActionButton
								action={deleteSection.bind(null, section.id)}
								requireAreYouSure
								pagination={["coursesP"]}
								variant={"destructiveOutline"}
								size={"sm"}
								aria-label="Delete"
							>
								<Trash2Icon />
							</ActionButton>
						</div>
					</SortableItem>
				))
			}
		</SortableList>
	);
}
