import { db } from "@/drizzle/db";
import { CourseSectionTable, LessonTable } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { revalidateLessonCache } from "./cache";
import { revalidatePath } from "next/cache";

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

export async function insertLesson(data: typeof LessonTable.$inferInsert) {
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

	revalidateLessonCache(newLesson.id, courseId!);
	revalidatePath(`admin/courses/${courseId}/edit`);
}

export async function updateLesson(
	lessonId: string,
	data: Partial<typeof LessonTable.$inferInsert>
) {
	console.log(data);
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

	revalidateLessonCache(updatedLesson.id, courseId);
	revalidatePath(`admin/courses/${courseId}/edit`);
}

export async function eliminateLesson(id: string) {
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

	revalidateLessonCache(deletedLesson.id, courseId);
	revalidatePath(`admin/courses/${courseId}/edit`);
}

export async function updateLessonOrders(lessonIds: string[]) {
	const [lessons, courseId] = await db.transaction(async (trx) => {
		const lessons = await Promise.all(
			lessonIds.map((id, index) =>
				db
					.update(LessonTable)
					.set({ order: index })
					.where(eq(LessonTable.id, id))
					.returning({
						sectionId: LessonTable.sectionId,
						id: LessonTable.id,
					})
			)
		);
		const sectionId = lessons[0]?.[0]?.sectionId;
		if (sectionId == null) return trx.rollback();

		const section = await trx.query.CourseSectionTable.findFirst({
			columns: { courseId: true },
			where: ({ id }, { eq }) => eq(id, sectionId),
		});

		if (section == null) return trx.rollback();

		return [lessons, section.courseId];
	});

	lessons.flat().forEach(({ id }) => {
		revalidateLessonCache(id, courseId);
	});
	revalidatePath(`admin/courses/${courseId}/edit`);
}
