import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, updatedAt } from "../schemaHelper";
import { UserTable } from "./User";
import { LessonTable } from "./Lesson";

export const UserLessonProgressTable = pgTable(
	"user_lesson_complete",
	{
		userId: uuid()
			.notNull()
			.references(() => UserTable.id, { onDelete: "cascade" }),
		lessonId: uuid()
			.notNull()
			.references(() => LessonTable.id, { onDelete: "cascade" }),
		createdAt,
		updatedAt,
	},
	(t) => [primaryKey({ columns: [t.userId, t.lessonId] })]
);

export const UserLessonProgressRelationships = relations(
	UserLessonProgressTable,
	({ one }) => ({
		user: one(UserTable, {
			fields: [UserLessonProgressTable.userId],
			references: [UserTable.id],
		}),
		lesson: one(LessonTable, {
			fields: [UserLessonProgressTable.lessonId],
			references: [LessonTable.id],
		}),
	})
);
