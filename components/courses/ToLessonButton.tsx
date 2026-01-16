import Link from "next/link";
import { Button } from "../ui/button";
import { ReactNode } from "react";

export default async function ToLessonButton({
	children,
	course,
	lessonFn,
	lesson,
}: {
	children: ReactNode;
	course: {
		courseId: string;
		courseSlug: string;
	};
	lessonFn: (lesson: {
		id: string;
		sectionId: string;
		order: number;
	}) => Promise<{ id: string } | undefined>;
	lesson: {
		id: string;
		sectionId: string;
		order: number;
	};
}) {
	const toLesson = await lessonFn(lesson);

	if (!toLesson) return null;
	return (
		<Button variant={"outline"} asChild>
			<Link
				href={`/courses/${course.courseId}/${course.courseSlug}/lessons/${toLesson.id}`}
			>
				{children}
			</Link>
		</Button>
	);
}
