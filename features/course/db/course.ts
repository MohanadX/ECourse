import { db } from "@/drizzle/db";
import { CourseSectionTable, CourseTable, LessonTable } from "@/drizzle/schema";
import { getCourseIdTag, getUserCoursesTag } from "./cache";
import { and, asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getCourseLessonsTag } from "@/features/lessons/db/cache";
import { getCourseSectionsTag } from "@/features/sections/db/cache";

export async function insertCourse(
	data: Omit<typeof CourseTable.$inferInsert, "slug">,
) {
	const slug = slugifyName(data.name);
	const [newCourse] = await db
		.insert(CourseTable)
		.values({
			...data,
			slug,
		})
		.returning();

	if (!newCourse) throw new Error(`Failed to create course ${data.name}`);

	return newCourse;
}

export async function getUserCourses(userId: string) {
	"use cache";
	cacheTag(getUserCoursesTag(userId));

	return await db.query.CourseTable.findMany({
		where: eq(CourseTable.userId, userId),
		orderBy: asc(CourseTable.name),
	});
}

/*
 * Convert a course name into a URL-friendly slug.
 * - Normalizes Unicode and removes diacritics
 * - Converts to lower-case
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses multiple hyphens and trims leading/trailing hyphens
 * - Limits slug length to 100 characters
 */
export function slugifyName(name: string): string {
	if (!name) return "";
	// Normalize and remove diacritics Handles names like "Café" → "Cafe" correctly.
	const normalized = name.normalize("NFKD").replace(/\p{Diacritic}/gu, "");
	// Lowercase and replace non-alphanum with hyphens
	let slug = normalized
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "");
	// Limit length
	if (slug.length > 100) slug = slug.slice(0, 100).replace(/-+$/g, "");
	return slug;
}

export function formatPlural(
	length: number,
	{
		singular,
		plural,
		includeCount = false,
	}: { singular: string; plural: string; includeCount?: boolean },
) {
	const word = length === 1 ? singular : plural;

	return includeCount ? `${length} ${word}` : word;
}

export async function updateCourse(
	id: string,
	data: Omit<typeof CourseTable.$inferInsert, "slug">,
	userId: string,
) {
	const slug = slugifyName(data.name);
	const [updatedCourse] = await db
		.update(CourseTable)
		.set({
			...data,
			slug,
		})
		.where(and(eq(CourseTable.id, id), eq(CourseTable.userId, userId)))
		.returning();

	if (!updatedCourse) throw new Error(`Failed to update ${data.name} course`);

	return updatedCourse;
}

export async function eliminateCourse(id: string, userId: string) {
	const [deletedCourse] = await db
		.delete(CourseTable)
		.where(and(eq(CourseTable.id, id), eq(CourseTable.userId, userId)))
		.returning();

	return deletedCourse;
}

export async function getCourse(courseId: string, userId: string) {
	"use cache";
	cacheTag(
		getCourseIdTag(courseId),
		getCourseSectionsTag(courseId),
		getCourseLessonsTag(courseId),
	);
	return await db.query.CourseTable.findFirst({
		columns: { id: true, name: true, description: true, userId: true },
		where: and(eq(CourseTable.id, courseId), eq(CourseTable.userId, userId)),
		with: {
			CourseSections: {
				orderBy: asc(CourseSectionTable.order),
				columns: { id: true, status: true, name: true },
				with: {
					lessons: {
						orderBy: asc(LessonTable.order),
						columns: {
							id: true,
							name: true,
							status: true,
							description: true,
							youtubeVideoId: true,
							sectionId: true,
						},
					},
				},
			},
		},
	});
}
