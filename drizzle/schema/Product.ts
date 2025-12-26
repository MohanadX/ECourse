import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelper";
import { CourseProductTable } from "./CourseProduct";

export const productsStatues = ["public", "private"] as const; // Do not widen the types to string[] Instead, keep them as literal types "public" and "private"
export type ProductStatus = (typeof productsStatues)[number]; // = "public" | "private" Extracts union of tuple values
// That means: “the type you get when indexing that tuple with a number.”
export const productStatusEnum = pgEnum("product_status", productsStatues);

export const ProductTable = pgTable("products", {
	id,
	slug: text().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	imageUrl: text().notNull(),
	priceInDollar: integer().notNull(),
	status: productStatusEnum().notNull().default("private"),
	createdAt,
	updatedAt,
});

export const ProductRelationShips = relations(ProductTable, ({ many }) => ({
	CourseProducts: many(CourseProductTable), // “A product has many join-table rows.”
}));
