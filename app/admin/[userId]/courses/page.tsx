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
import { COURSES_LIMIT } from "@/data/zodSchema/course";

const Courses = async ({
	params,
	searchParams,
}: {
	params: Promise<{ userId: string }>;
	searchParams: Promise<{ page?: string }>;
}) => {
	const { userId } = await params;

	const { page: pageParam } = await searchParams;
	const page = Number(pageParam ?? 1);
	const skip = (page - 1) * COURSES_LIMIT;

	const [courses, [coursesNumber]] = await getCourses(
		userId,
		COURSES_LIMIT,
		skip,
	);
	const coursesCount = coursesNumber.coursesCount ?? 0;

	const totalPages = Math.ceil(coursesCount / COURSES_LIMIT);

	return (
		<main className="containers mt-6">
			<PageHeader title="Courses">
				<Button asChild variant={"default"}>
					<Link href={`/admin/${userId}/courses/new`}>New Course</Link>
				</Button>
			</PageHeader>

			<article>
				<CoursesTable
					initialCourses={courses}
					coursesCount={coursesCount}
					initialPage={page}
					totalPages={totalPages}
				/>
			</article>
		</main>
	);
};

export default Courses;

async function getCourses(userId: string, limit: number, skip: number) {
	"use cache";
	cacheTag(
		getUserCoursesTag(userId),
		getAdminCourseAccessTag(userId),
		getAdminCourseSectionsTag(userId),
		getAdminLessonsTag(userId),
	);

	return Promise.all([
		db
			.select({
				id: DBCourse.id,
				name: DBCourse.name,
				sectionsCount: countDistinct(CourseSectionTable),
				lessonsCount: countDistinct(LessonTable),
				studentsCount: countDistinct(UserCourseAccessTable),
			})
			.from(DBCourse)
			.where(eq(DBCourse.userId, userId))
			.leftJoin(
				CourseSectionTable,
				eq(CourseSectionTable.courseId, DBCourse.id),
			)
			.leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
			.leftJoin(
				UserCourseAccessTable,
				eq(UserCourseAccessTable.courseId, DBCourse.id),
			)
			.orderBy(asc(DBCourse.name))
			.groupBy(DBCourse.id)
			.limit(limit)
			.offset(skip),
		db
			.select({
				coursesCount: countDistinct(DBCourse.id),
			})
			.from(DBCourse)
			.where(eq(DBCourse.userId, userId)),
	]);
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
