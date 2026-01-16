import {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelper";
import { UserTable } from "./User";
import { ProductTable } from "./Product";
import { relations } from "drizzle-orm";

export const PurchaseTable = pgTable("purchase", {
	id,
	pricePaidInCents: integer().notNull(),
	productDetails: jsonb() // original data at purchasing time (if the product details has changed after purchase operation)
		.notNull()
		.$type<{ name: string; description: string; imageUrl: string }>(), // is purely a TypeScript typing helper used by Drizzle.
	userId: uuid()
		.notNull()
		.references(() => UserTable.id, { onDelete: "restrict" }),
	adminId: uuid().references(() => UserTable.id),
	productId: uuid() // real time product data (if the data has changed this will be useful for oberservbility)
		.notNull()
		.references(() => ProductTable.id, { onDelete: "restrict" }),
	stripeSessionId: text().notNull().unique(),
	refundedAt: timestamp({ withTimezone: true }),
	createdAt,
	updatedAt,
});

export const purchaseRelationships = relations(PurchaseTable, ({ one }) => ({
	user: one(UserTable, {
		fields: [PurchaseTable.userId],
		references: [UserTable.id],
	}),
	product: one(ProductTable, {
		fields: [PurchaseTable.productId],
		references: [ProductTable.id],
	}),
}));

// In PostgreSQL, jsonb is a data type that stores JSON data in a binary format.
