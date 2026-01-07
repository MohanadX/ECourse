import CoursesTable from "@/components/courses/CoursesTable";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import {
	getCourseGlobalTag,
	getUserAccessCourseGlobalTag,
} from "@/features/course/db/cache";
import { cacheTag } from "next/cache";
import {
	CourseSectionTable,
	CourseTable as DBCourse,
	LessonTable,
	UserCourseAccessTable,
} from "@/drizzle/schema";

import Link from "next/link";
import { asc, countDistinct, eq } from "drizzle-orm";
import { getCourseSectionGlobalTag } from "@/features/sections/db/cache";
import { getLessonsGlobalTag } from "@/features/lessons/db/cache";

const Courses = async () => {
	const courses = await getCourses();
	return (
		<main className="containers mt-6">
			<PageHeader title="Courses">
				<Button asChild variant={"default"}>
					<Link href={"/admin/courses/new"}>New Course</Link>
				</Button>
			</PageHeader>

			<article>
				<CoursesTable courses={courses}></CoursesTable>
			</article>
		</main>
	);
};

export default Courses;

async function getCourses() {
	"use cache";
	cacheTag(
		getCourseGlobalTag(),
		getUserAccessCourseGlobalTag(),
		getCourseSectionGlobalTag(),
		getLessonsGlobalTag()
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
