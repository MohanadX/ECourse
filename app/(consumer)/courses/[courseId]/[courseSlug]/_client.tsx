"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function CoursePageClient({
	course,
}: {
	course: {
		name: string;
		slug: string;
		id: string;
		CourseSections: {
			id: string;
			name: string;
			lessons: {
				id: string;
				name: string;
				isComplete: boolean;
			}[];
		}[];
	};
}) {
	const { lessonId } = useParams();
	const defaultValue =
		typeof lessonId === "string"
			? course.CourseSections.find((section) =>
					section.lessons.find((lesson) => lesson.id, lessonId)
			  )
			: course.CourseSections[0];

	return (
		<Accordion
			type="multiple"
			defaultValue={defaultValue ? [defaultValue.id] : undefined}
		>
			{course.CourseSections.map((section) => (
				<AccordionItem key={section.id} value={section.id}>
					<AccordionTrigger className="text-lg">
						{section.name}
					</AccordionTrigger>
					<AccordionContent className="flex flex-cols flex-wrap gap-1">
						{section.lessons.map((lesson) => (
							<Button
								variant={"ghost"}
								asChild
								key={lesson.id}
								className={cn(
									"w-full justify-start",
									lessonId === lesson.id && "bg-accent/75 text-background"
								)}
							>
								<Link
									href={`/courses/${course.id}/${course.slug}/lessons/${lesson.id}`}
								>
									<VideoIcon aria-hidden />
									{lesson.name}
									{lesson.isComplete && (
										<CheckCircle2Icon className="ml-auto" />
									)}
								</Link>
							</Button>
						))}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}
