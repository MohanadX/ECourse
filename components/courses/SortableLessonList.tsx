"use client";

import { SortableItem, SortableList } from "./SortableList";
import { cn } from "@/lib/utils";
import { EyeClosed, Trash2Icon, VideoIcon } from "lucide-react";
import { DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import ActionButton from "../ActionButton";
import { lessonStatus } from "@/drizzle/schema";
import LessonFormDialog from "./LessonFormDialog";
import { deleteLesson, mutateLessonOrders } from "@/features/actions/lesson";

export default function SortableLessonList({
	sections,
	lessons,
}: {
	lessons: {
		id: string;
		name: string;
		status: lessonStatus;
		youtubeVideoId: string;
		description: string | null;
		sectionId: string;
	}[];
	sections: {
		id: string;
		name: string;
	}[];
}) {
	return (
		<SortableList items={lessons} onOrderChangeAction={mutateLessonOrders}>
			{(
				items // function as child pattern
			) =>
				items.map((lesson) => (
					<SortableItem
						key={lesson.id}
						id={lesson.id}
						className="flex items-center gap-1"
					>
						<p
							className={cn(
								"contents",
								lesson.status === "private" && "text-muted-foreground"
							)}
						>
							{lesson.status === "private" && <EyeClosed className="size-4" />}
							{lesson.status === "preview" && <VideoIcon className="size-4" />}
							{lesson.name}
						</p>
						<div className="ml-auto flex items-center gap-2">
							<LessonFormDialog lesson={lesson} sections={sections}>
								<DialogTrigger asChild>
									<Button
										className="cursor-pointer"
										variant={"outline"}
										size={"sm"}
									>
										Edit
									</Button>
								</DialogTrigger>
							</LessonFormDialog>
							<ActionButton
								action={deleteLesson.bind(null, lesson.id)}
								requireAreYouSure
								variant={"destructiveOutline"}
								size={"sm"}
							>
								<Trash2Icon />
								<span className="sr-only">Delete</span>
							</ActionButton>
						</div>
					</SortableItem>
				))
			}
		</SortableList>
	);
}
