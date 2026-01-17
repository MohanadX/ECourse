import { db } from "@/drizzle/db";
import { CourseSectionTable, CourseTable } from "@/drizzle/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
	},
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

/**
 *  from(courses) brings courses into scope like a JOIN.
	But it is not a real JOIN result set like in SELECT.
	It is a filtering join, not a data-producing join.
 */
export async function updateSection(
	sectionId: string,
	data: Partial<typeof CourseSectionTable.$inferInsert>,
	userId: string,
) {
	const [updatedSection] = await db
		.update(CourseSectionTable)
		.set(data)
		.from(CourseTable)
		.where(
			and(
				eq(CourseSectionTable.id, sectionId),
				eq(CourseSectionTable.courseId, CourseTable.id),
				eq(CourseTable.userId, userId),
			),
		)
		.returning();

	if (!updatedSection) throw new Error(`Failed to update ${data.name} section`);

	return updatedSection;
}

/**
 * The USING clause specifies additional tables that can be referenced in the WHERE condition of a DELETE command.
 */
export async function eliminateSection(id: string, userId: string) {
	const [deletedSection] = await db
		.delete(CourseSectionTable)
		.where(
			and(
				eq(CourseSectionTable.id, id),
				inArray(
					CourseSectionTable.courseId,
					db
						.select({ id: CourseTable.id })
						.from(CourseTable)
						.where(eq(CourseTable.userId, userId)),
				),
			),
		)
		.returning();

	return deletedSection;
}

export async function updateSectionOrders(
	sectionIds: string[],
	userId: string,
) {
	if (sectionIds.length === 0) return;

	const caseSql = sql`CASE ${CourseSectionTable.id} ${sql.join(
		sectionIds.map(
			(sectionId, index) => sql`WHEN ${sectionId} THEN ${index}::integer`,
		),
		sql.raw(" "),
	)} END`;

	const orderedSections = await db
		.update(CourseSectionTable)
		.set({ order: caseSql })
		.from(CourseTable)
		.where(
			and(
				inArray(CourseSectionTable.id, sectionIds),
				eq(CourseSectionTable.courseId, CourseTable.id),
				eq(CourseTable.userId, userId),
			),
		)
		.returning({
			id: CourseSectionTable.id,
			courseId: CourseSectionTable.courseId,
		});

	if (orderedSections.length !== sectionIds.length) {
		throw new Error("Failed to update section orders");
	}

	const courseId = orderedSections[0].courseId;
	for (const { id } of orderedSections) {
		revalidateCourseSectionsCache(userId, courseId, id);
	}
	revalidatePath(`/admin/${userId}/courses/${courseId}/edit`);
}

export const wherePublicCourseSections = eq(
	CourseSectionTable.status,
	"public",
);

/**
 4. WHERE id IN ('l1', 'l2', 'l3')
This restricts the update to only the lessons you want to reorder.

Without this:
Every row in lessons would be updated
Rows not matched by CASE would get NULL for order
So this clause is critical for correctness and safety.

.where(inArray(CourseSectionTable.id, sectionIds))

Only updates sections whose IDs are in the sectionIds array.

Safe and efficient: avoids updating rows that don’t need changes.

✔ Performance

One SQL statement

One network round-trip

One execution plan

UPDATE lessons
SET "order" = CASE id
  WHEN 'l1' THEN 0
  WHEN 'l2' THEN 1
  WHEN 'l3' THEN 2
END
WHERE id IN ('l1', 'l2', 'l3')
RETURNING id, section_id;
 */
