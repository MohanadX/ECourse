import PageHeader from "@/components/PageHeader";
import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { getCourseIdTag } from "@/features/course/db/cache";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";

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

async function getCourse(courseId: string) {
	"use cache";
	cacheTag(getCourseIdTag(courseId));

	return db.query.CourseTable.findFirst({
		columns: { id: true, name: true, description: true },
		where: eq(CourseTable.id, courseId),
	});
}
