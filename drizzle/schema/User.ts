import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelper";
import { relations } from "drizzle-orm";
import { UserCourseAccessTable } from "./UserCourseAccess";

export const userRoles = ["user", "admin"] as const;
export type userRolesType = (typeof userRoles)[number];
export const userRolesEnum = pgEnum("user_role", userRoles);

export const UserTable = pgTable("users", {
	id,
	clerkUserId: text().notNull().unique(),
	email: text().notNull(),
	name: text().notNull(),
	role: userRolesEnum().notNull().default("admin"),
	imageUrl: text(),
	deletedAt: timestamp({ withTimezone: true }),
	createdAt,
	updatedAt,
});

export const userRelationships = relations(UserTable, ({ many }) => ({
	UserCourseAccess: many(UserCourseAccessTable),
}));
