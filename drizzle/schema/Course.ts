import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelper";
import { CourseProductTable } from "./CourseProduct";
import { UserCourseAccessTable } from "./UserCourseAccess";
import { CourseSectionTable } from "./CourseSections";

export const CourseTable = pgTable("courses", {
	id,
	name: text().notNull(),
	description: text().notNull(),
	slug: text().notNull(),
	createdAt,
	updatedAt,
});

export const CourseRelationShips = relations(CourseTable, ({ many }) => ({
	CourseProducts: many(CourseProductTable), // A Course can be part of many CourseProduct rows.
	UserCourseAccess: many(UserCourseAccessTable),
	CourseSections: many(CourseSectionTable),
}));
