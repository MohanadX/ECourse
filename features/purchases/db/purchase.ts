import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";

export async function insertPurchase(
	data: typeof PurchaseTable.$inferInsert,
	trx: Omit<typeof db, "$client"> = db
) {
	const details = data.productDetails;

	const [newPurchase] = await trx
		.insert(PurchaseTable)
		.values({
			...data,
			productDetails: {
				name: details.name, // just make sure not to add additional info
				description: details.description,
				imageUrl: details.imageUrl,
			},
		})
		.onConflictDoNothing()
		.returning();
	// sometimes stripe send GET request 2 times after purchase so a conflict will happen and we don't want to save purchase twice

	return newPurchase;
}
