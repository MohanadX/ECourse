"use server";

import { db } from "@/drizzle/db";
import { stripeServerClient } from "@/StripeServer";
import { updatePurchase } from "../purchases/db/purchase";
import { revokeUserCourseAccess } from "../course/db/CourseAccess";

export async function refundPurchase(purchaseId: string) {
	const dataProcess = await db.transaction(async (trx) => {
		try {
			const refundedPurchase = await updatePurchase(
				purchaseId,
				{
					refundedAt: new Date(),
				},
				trx
			);

			if (!refundedPurchase) {
				trx.rollback();
				return {
					success: false,
					message: "Failed to update purchase",
				};
			}

			const session = await stripeServerClient.checkout.sessions.retrieve(
				refundedPurchase.stripeSessionId
			);

			if (session.payment_intent == null) {
				trx.rollback();
				return {
					success: false,
					message: "Error occurred while refunding this purchase ",
				};
			}

			try {
				await revokeUserCourseAccess(
					{
						productId: refundedPurchase!.productId,
						userId: refundedPurchase!.userId,
					},
					trx
				);
				// revoke in db first so if it fails we can rollback (we can't roll back stripe state if db fails)
				await stripeServerClient.refunds.create({
					payment_intent:
						typeof session.payment_intent === "string" // it means that it is id
							? session.payment_intent
							: session.payment_intent.id,
				});
			} catch (error) {
				console.error(error);
				trx.rollback();
				return {
					success: false,
					message: "Error occurred while refunding this purchase ",
				};
			}
		} catch (error) {
			console.error(error);
			trx.rollback();
			return {
				success: false,
				message: "Failed to update purchase",
			};
		}
	});

	return (
		dataProcess ?? { success: true, message: "Successfully refunded purchase" }
	);
}
