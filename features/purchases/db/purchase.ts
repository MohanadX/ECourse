import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePurchasesCache } from "./cache";

/**
+ * Inserts a purchase record into the database.
+ * @param data - Purchase data to insert
+ * @param trx - Optional transaction context
+ * @returns The inserted purchase, or undefined if a duplicate stripeSessionId exists
+ */

export async function insertPurchase(
	data: typeof PurchaseTable.$inferInsert,
	trx: Omit<typeof db, "$client"> = db,
): Promise<typeof PurchaseTable.$inferSelect | undefined> {
	const details = data.productDetails;

	if (!details) {
		throw new Error("Product details is required for purchase");
	}

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
	// Stripe may send duplicate webhook events for the same transaction, so we use onConflictDoNothing() to ensure idempotent purchase recording
	if (newPurchase) {
		revalidatePurchasesCache({
			purchaseId: newPurchase.id,
			userId: newPurchase.userId,
			adminId: newPurchase.adminId,
		});
	}

	return newPurchase;
}

export async function updatePurchase(
	purchaseId: string,
	data: Partial<typeof PurchaseTable.$inferInsert>,
	trx: Omit<typeof db, "$client"> = db,
): Promise<typeof PurchaseTable.$inferSelect | undefined> {
	const details = data.productDetails;

	const [updatedPurchase] = await trx
		.update(PurchaseTable)
		.set({
			...data,
			...(details && {
				productDetails: {
					name: details.name,
					description: details.description,
					imageUrl: details.imageUrl,
				},
			}),
		})
		.where(eq(PurchaseTable.id, purchaseId))
		.returning();
	if (!updatedPurchase) throw new Error("Failed to update purchase");

	revalidatePurchasesCache({
		purchaseId: updatedPurchase.id,
		userId: updatedPurchase.userId,
		adminId: updatedPurchase.adminId,
	});

	return updatedPurchase;
}
