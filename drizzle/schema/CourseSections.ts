import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelper";
import { CourseTable } from "./Course";
import { LessonTable } from "./Lesson";

export const courseSectionStatues = ["public", "private"] as const;
export type CourseSectionStatus = (typeof courseSectionStatues)[number];
export const courseSectionStatusEnum = pgEnum(
	"course_section_status",
	courseSectionStatues
);

export const CourseSectionTable = pgTable("course_sections", {
	id,
	name: text().notNull(),
	status: courseSectionStatusEnum().notNull().default("private"),
	order: integer().notNull(),
	courseId: uuid()
		.notNull()
		.references(() => CourseTable.id, { onDelete: "cascade" }),
	createdAt,
	updatedAt,
});

export const CourseSectionRelationShips = relations(
	CourseSectionTable,
	({ one, many }) => ({
		course: one(CourseTable, {
			fields: [CourseSectionTable.courseId],
			references: [CourseTable.id],
		}),
		lessons: many(LessonTable),
	})
);
