import { db } from "@/drizzle/db";
import { CourseSectionTable } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { revalidateCourseSectionsCache } from "./cache";
import { revalidatePath } from "next/cache";

/*
{courseId}, {eq}
where: (table, operators) =>
operators.eq(table.courseId, courseId)

This function receives two arguments, both provided by Drizzle:
First argument → table columns
Second argument → SQL operators
*/

export async function getNextOrderOfSection(courseId: string) {
	const section = await db.query.CourseSectionTable.findFirst({
		columns: { order: true },
		where: eq(CourseSectionTable.courseId, courseId),
		orderBy: desc(CourseSectionTable.order),
	});

	return section ? section.order + 1 : 0;
}

export async function insertSection(
	data: typeof CourseSectionTable.$inferInsert & {
		courseId: string;
	}
) {
	const [newSection] = await db
		.insert(CourseSectionTable)
		.values({
			...data,
		})
		.returning();

	if (!newSection) throw new Error(`Failed to create section ${data.name}`);

	return newSection;
}

export async function updateSection(
	sectionId: string,
	data: Partial<typeof CourseSectionTable.$inferInsert>
) {
	const [updatedSection] = await db
		.update(CourseSectionTable)
		.set(data)
		.where(eq(CourseSectionTable.id, sectionId))
		.returning();

	if (!updatedSection) throw new Error(`Failed to update ${data.name} section`);

	return updatedSection;
}

export async function eliminateSection(id: string) {
	const [deletedCourse] = await db
		.delete(CourseSectionTable)
		.where(eq(CourseSectionTable.id, id))
		.returning();

	return deletedCourse;
}

export async function updateSectionOrders(sectionIds: string[]) {
	const sections = await Promise.all(
		sectionIds.map((id, index) =>
			db
				.update(CourseSectionTable)
				.set({ order: index })
				.where(eq(CourseSectionTable.id, id))
				.returning({
					courseId: CourseSectionTable.courseId,
					id: CourseSectionTable.id,
				})
		)
	);

	if (!sections) throw new Error("Failed to update section orders");

	sections.flat().forEach(({ id, courseId }) => {
		revalidateCourseSectionsCache(courseId, id);
		revalidatePath(`admin/courses/${courseId}/edit`);
	});
}
