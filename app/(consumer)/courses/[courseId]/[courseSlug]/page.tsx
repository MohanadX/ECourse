import PageHeader from "@/components/PageHeader";
import { notFound } from "next/navigation";
import { getCourse } from "./layout";

export default async function CoursePage({
	params,
}: {
	params: Promise<{ courseId: string }>;
}) {
	const { courseId } = await params;

	const course = await getCourse(courseId);

	if (!course) return notFound();

	return (
		<>
			<PageHeader title={course.name} />
			<p className="text-muted-foreground">{course.description}</p>
		</>
	);
}

