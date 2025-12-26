import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = uuid().primaryKey().defaultRandom(); // auto generated when a row is created
export const createdAt = timestamp({ withTimezone: true })
	.notNull()
	.defaultNow();
export const updatedAt = timestamp({ withTimezone: true })
	.notNull()
	.defaultNow() // default value is the current timestamp (when the row is created).
	.$onUpdate(() => new Date());
