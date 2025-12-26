import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelper";
import { CourseSectionTable } from "./CourseSections";
import { relations } from "drizzle-orm";
import { UserLessonProgressTable } from "./UserLessonProgress";

export const lessonStatues = ["public", "private", "preview"] as const;
export type lessonStatus = (typeof lessonStatues)[number];
export const lessonStatusEnum = pgEnum("lessons_status", lessonStatues);

export const LessonTable = pgTable("lessons", {
	id,
	name: text().notNull(),
	description: text(),
	youtubeVideoId: text().notNull(),
	order: integer().notNull(),
	status: lessonStatusEnum().notNull().default("private"),
	sectionId: uuid()
		.notNull()
		.references(() => CourseSectionTable.id, { onDelete: "cascade" }),
	createdAt,
	updatedAt,
});

export const LessonRelationships = relations(LessonTable, ({ one, many }) => ({
	section: one(CourseSectionTable, {
		fields: [LessonTable.sectionId],
		references: [CourseSectionTable.id],
	}),
	userLessonComplete: many(UserLessonProgressTable), // references and field are already in UserLessonProgressTable
}));
