// this for joining course with products (the products can have so many course and the course can exist in many products)

import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { ProductTable } from "./Product";
import { CourseTable } from "./Course";
import { createdAt, updatedAt } from "../schemaHelper";
import { relations } from "drizzle-orm";

export const CourseProductTable = pgTable(
	"course_products",
	{
		courseId: uuid() // the course is stored in a row with it product id (join table)
			.notNull()
			.references(() => CourseTable.id, { onDelete: "restrict" }), // If a Course is still linked to any products, PostgreSQL will prevent deletion of that course.
		productId: uuid()
			.notNull()
			.references(() => ProductTable.id, { onDelete: "cascade" }), // If a Product is deleted, PostgreSQL will automatically delete the related rows in course_products.
		createdAt,
		updatedAt,
	},
	(t) => [primaryKey({ columns: [t.courseId, t.productId] })]
);

export const CourseProductRelationships = relations(
	CourseProductTable,
	({ one }) => ({
		//  “Each join row links to one course.”
		course: one(CourseTable, {
			fields: [CourseProductTable.courseId],
			references: [CourseTable.id],
		}),
		product: one(ProductTable, {
			fields: [CourseProductTable.productId],
			references: [ProductTable.id],
		}),
	})
);

/*
A Course can belong to many Products
A Product can contain many Courses
| courseId | productId |
| -------- | --------- |
| C1       | P1        |
| C2       | P1        |
| C3       | P1        |
(t) => [primaryKey({ columns: [t.courseId, t.productId] })]
The pair (courseId, productId) must be unique
You cannot insert the same combination twice

✔ It gives access to t.columnName from within the callback
✔ It lets you reference columns that were declared above
✔ It’s the official way in Drizzle to define:

composite primary keys
multi-column indexes
multi-column constraints
So no, you cannot use a column-level primaryKey() here when the key spans more than one column.
*/
