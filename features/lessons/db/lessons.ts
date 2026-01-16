import { db } from "@/drizzle/db";
import {
	CourseSectionTable,
	CourseTable,
	lessonStatus,
	LessonTable,
	UserCourseAccessTable,
	userRolesType,
} from "@/drizzle/schema";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getLessonIdTag, revalidateLessonCache } from "./cache";
import { cacheTag, revalidatePath } from "next/cache";
import { wherePublicCourseSections } from "@/features/sections/db/sections";
import { getUserCourseAccessUserTag } from "@/features/course/db/CourseAccessCache";

/*
{courseId}, {eq}
where: (table, operators) =>
operators.eq(table.courseId, courseId)

This function receives two arguments, both provided by Drizzle:
First argument → table columns
Second argument → SQL operators
*/

export async function getNextOrderOfLesson(sectionId: string) {
	const section = await db.query.LessonTable.findFirst({
		columns: { order: true },
		where: eq(LessonTable.sectionId, sectionId),
		orderBy: desc(LessonTable.order),
	});

	return section ? section.order + 1 : 0;
}

export async function insertLesson(
	data: typeof LessonTable.$inferInsert,
	userId: string
) {
	// trx transaction scoped client
	const [newLesson, courseId] = await db.transaction(async (trx) => {
		const [[newLesson], section] = await Promise.all([
			trx.insert(LessonTable).values(data).returning(),
			trx.query.CourseSectionTable.findFirst({
				columns: { courseId: true },
				where: eq(CourseSectionTable.id, data.sectionId),
			}),
		]);
		if (!section) {
			console.error(`Section of ${data.name} is not found`);
			trx.rollback();
		}

		if (!newLesson) {
			console.error(`Failed to create lesson ${data.name}`);
			trx.rollback();
		}
		return [newLesson, section?.courseId];
	});

	revalidateLessonCache({
		lessonId: newLesson.id,
		courseId: courseId!,
		userId,
	});
	revalidatePath(`/admin/${userId}/courses/${courseId}/edit`);
}

export async function updateLesson(
	lessonId: string,
	data: Partial<typeof LessonTable.$inferInsert>,
	userId: string
) {
	const [updatedLesson, courseId] = await db.transaction(async (trx) => {
		const currentLesson = await trx.query.LessonTable.findFirst({
			where: eq(LessonTable.id, lessonId),
			columns: { sectionId: true },
		});

		if (
			!currentLesson?.sectionId &&
			currentLesson?.sectionId !== data.sectionId &&
			!data.order
		) {
			data.order = await getNextOrderOfLesson(data.sectionId!);
		}

		const [updatedLesson] = await trx
			.update(LessonTable)
			.set(data)
			.where(eq(LessonTable.id, lessonId))
			.returning();

		if (!updatedLesson) {
			console.error(`Failed to update ${data.name} lesson`);
			trx.rollback();
		}

		const section = await trx.query.CourseSectionTable.findFirst({
			columns: { courseId: true },
			where: eq(CourseSectionTable.id, updatedLesson.sectionId),
		});

		if (!section) {
			console.error(`Section of ${data.name} is not found`);
			trx.rollback();
		}

		return [updatedLesson, section!.courseId];
	});

	revalidateLessonCache({
		lessonId: updatedLesson.id,
		courseId: courseId!,
		userId,
	});
	revalidatePath(`/admin/${userId}/courses/${courseId}/edit`);
}

export async function eliminateLesson(id: string, userId: string) {
	const [deletedLesson, courseId] = await db.transaction(async (trx) => {
		const [deletedLesson] = await trx
			.delete(LessonTable)
			.where(eq(LessonTable.id, id))
			.returning();

		if (!deletedLesson) {
			console.error("Failed to delete your lesson");
			trx.rollback();
		}

		const sectionId = deletedLesson.sectionId;

		const section = await trx.query.CourseSectionTable.findFirst({
			columns: { courseId: true },
			where: eq(CourseSectionTable.id, sectionId),
		});

		if (!section) {
			console.error("Section of this lesson is not found");
			trx.rollback();
		}

		return [deletedLesson, section!.courseId];
	});

	revalidateLessonCache({
		lessonId: deletedLesson.id,
		courseId: courseId!,
		userId,
	});
	revalidatePath(`/admin/${userId}/courses/${courseId}/edit`);
}

export async function updateLessonOrders(lessonIds: string[], userId: string) {
	if (lessonIds.length === 0) return;

	const caseSql = sql`CASE ${LessonTable.id} ${sql.join(
		lessonIds.map(
			(sectionId, index) => sql`WHEN ${sectionId} THEN ${index}::integer`
		),
		sql.raw(" ")
	)} END`;

	const orderedLessons = await db
		.update(LessonTable)
		.set({ order: caseSql })
		.where(inArray(LessonTable.id, lessonIds))
		.returning({
			id: LessonTable.id,
			sectionId: LessonTable.sectionId,
		});

	if (orderedLessons.length !== lessonIds.length) {
		throw new Error("Failed to update section orders");
	}

	const sectionId = orderedLessons[0].sectionId;

	const section = await db.query.CourseSectionTable.findFirst({
		columns: { courseId: true },
		where: eq(CourseSectionTable.id, sectionId),
	});
	if (!section) {
		throw new Error("Section of this lesson is not found");
	}

	for (const { id } of orderedLessons) {
		revalidateLessonCache({
			lessonId: id,
			courseId: section.courseId,
			userId,
		});
	}

	revalidatePath(`/admin/${userId}/courses/${section.courseId}/edit`);
}

export const wherePublicLessons = or(
	eq(LessonTable.status, "public"),
	eq(LessonTable.status, "preview")
);

export async function canViewLesson(
	role: userRolesType | undefined,
	userId: string,
	lesson: { id: string; status: lessonStatus }
) {
	"use cache";
	cacheTag(getUserCourseAccessUserTag(userId), getLessonIdTag(lesson.id));
	if (lesson.status === "preview") return true;
	if (!userId || lesson.status === "private") return false;

	const [data] = await db
		.select({ courseId: CourseTable.id })
		.from(UserCourseAccessTable)
		.leftJoin(CourseTable, eq(CourseTable.id, UserCourseAccessTable.courseId))
		.leftJoin(
			CourseSectionTable,
			and(
				eq(CourseSectionTable.courseId, CourseTable.id),
				wherePublicCourseSections
			)
		)
		.leftJoin(
			LessonTable,
			and(eq(LessonTable.sectionId, CourseSectionTable.id), wherePublicLessons)
		)
		.where(
			and(
				eq(LessonTable.id, lesson.id),
				eq(UserCourseAccessTable.userId, userId)
			)
		)
		.limit(1);

	return data != null && data.courseId != null;
}

// Critical detail: LEFT JOIN + WHERE = INNER JOIN
