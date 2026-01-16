import CoursesTable from "@/components/courses/CoursesTable";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import { getUserCoursesTag } from "@/features/course/db/cache";
import { getAdminCourseAccessTag } from "@/features/course/db/CourseAccessCache";
import { getAdminLessonsTag } from "@/features/lessons/db/cache";
import { getAdminCourseSectionsTag } from "@/features/sections/db/cache";
import { cacheTag } from "next/cache";
import Link from "next/link";
import { CourseTable as DBCourse } from "@/drizzle/schema";
import { LessonTable } from "@/drizzle/schema";
import { UserCourseAccessTable } from "@/drizzle/schema";
import { CourseSectionTable } from "@/drizzle/schema";
import { countDistinct, eq, asc } from "drizzle-orm";

const Courses = async ({ params }: { params: Promise<{ userId: string }> }) => {
	const { userId } = await params;
	const courses = await getCourses(userId);
	return (
		<main className="containers mt-6">
			<PageHeader title="Courses">
				<Button asChild variant={"default"}>
					<Link href={`/admin/${userId}/courses/new`}>New Course</Link>
				</Button>
			</PageHeader>

			<article>
				<CoursesTable courses={courses}></CoursesTable>
			</article>
		</main>
	);
};

export default Courses;

async function getCourses(userId: string) {
	"use cache";
	cacheTag(
		getUserCoursesTag(userId),
		getAdminCourseAccessTag(userId),
		getAdminCourseSectionsTag(userId),
		getAdminLessonsTag(userId)
	);

	return db
		.select({
			id: DBCourse.id,
			name: DBCourse.name,
			sectionsCount: countDistinct(CourseSectionTable),
			lessonsCount: countDistinct(LessonTable),
			studentsCount: countDistinct(UserCourseAccessTable),
		})
		.from(DBCourse)
		.where(eq(DBCourse.userId, userId))
		.leftJoin(CourseSectionTable, eq(CourseSectionTable.courseId, DBCourse.id))
		.leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
		.leftJoin(
			UserCourseAccessTable,
			eq(UserCourseAccessTable.courseId, DBCourse.id)
		)
		.orderBy(asc(DBCourse.name))
		.groupBy(DBCourse.id);
}

/*
inner Join:
✔️ Returns only courses that have at least one section
❌ Courses with zero sections are excluded

| Join Type  | Rows Returned           |
| ---------- | ----------------------- |
| INNER JOIN | Only matching rows      |
| LEFT JOIN  | All left rows + matches |

*/
