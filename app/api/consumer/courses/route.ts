import { COURSES_LIMIT } from "@/data/zodSchema/course";
import { db } from "@/drizzle/db";
import {
	CourseTable,
	CourseSectionTable,
	LessonTable,
	UserCourseAccessTable,
	UserLessonProgressTable,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/features/users/db/clerk";
import { wherePublicLessons } from "@/features/lessons/db/lessons";
import { wherePublicCourseSections } from "@/features/sections/db/sections";
import { and, countDistinct, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const page = Number(req.nextUrl.searchParams.get("page"));
		const { userId } = await getCurrentUser();

		if (!userId) {
			return NextResponse.json(null, { status: 401 });
		}

		const skip = (page - 1) * COURSES_LIMIT;
		const courses = await db
			.select({
				id: CourseTable.id,
				name: CourseTable.name,
				slug: CourseTable.slug,
				description: CourseTable.description,
				sectionsCount: countDistinct(CourseSectionTable.id),
				lessonsCount: countDistinct(LessonTable.id),
				lessonCompleted: countDistinct(UserLessonProgressTable.lessonId),
			})
			.from(CourseTable)
			.innerJoin(
				UserCourseAccessTable,
				and(
					eq(UserCourseAccessTable.courseId, CourseTable.id),
					eq(UserCourseAccessTable.userId, userId),
				),
			)
			.leftJoin(
				CourseSectionTable,
				and(
					eq(CourseSectionTable.courseId, CourseTable.id),
					wherePublicCourseSections,
				),
			)
			.leftJoin(
				LessonTable,
				and(
					eq(LessonTable.sectionId, CourseSectionTable.id),
					wherePublicLessons,
				),
			)
			.leftJoin(
				UserLessonProgressTable,
				and(
					eq(UserLessonProgressTable.lessonId, LessonTable.id),
					eq(UserLessonProgressTable.userId, userId),
				),
			)
			.orderBy(CourseTable.name)
			.groupBy(CourseTable.id)
			.limit(COURSES_LIMIT)
			.offset(skip);

		if (!courses) {
			return NextResponse.json([], { status: 204 });
		}

		return NextResponse.json(courses, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(null, { status: 500 });
	}
}
