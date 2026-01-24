import { COURSES_LIMIT } from "@/data/zodSchema/course";
import { db } from "@/drizzle/db";
import {
	CourseTable as DBCourse,
	CourseSectionTable,
	LessonTable,
	UserCourseAccessTable,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/features/users/db/clerk";
import { asc, countDistinct, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const page = Number(req.nextUrl.searchParams.get("page"));
		const { userId } = await getCurrentUser();

		const skip = (page - 1) * COURSES_LIMIT;
		const courses = await db
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
			.limit(COURSES_LIMIT)
			.offset(skip);

		if (!courses) {
			return NextResponse.json(null, { status: 204 });
		}

		return NextResponse.json(courses, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(null, { status: 500 });
	}
}
