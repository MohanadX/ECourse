"use server";

import { db } from "@/drizzle/db";
import { stripeServerClient } from "@/StripeServer";
import { updatePurchase } from "../purchases/db/purchase";
import { revokeUserCourseAccess } from "../course/db/CourseAccess";
import { getCurrentUser } from "../users/db/clerk";
import { productPermission } from "./products";
import { after } from "next/server";

export async function refundPurchase(purchaseId: string, stripeSessionId: string) {
	const { userId, role } = await getCurrentUser();
	if (!userId || !(await productPermission(role))) {
		return {
			success: false,
			message: "Unauthorized",
		};
	}
	const dataProcess = await db.transaction(async (trx) => {
		try {
			const [refundedPurchase, session] = await Promise.all([
				updatePurchase(
					purchaseId,
					{
						refundedAt: new Date(),
					},
					trx,
				),
				stripeServerClient.checkout.sessions.retrieve(
					stripeSessionId,
				),
			]);

			if (!refundedPurchase) {
				trx.rollback();
				return {
					success: false,
					message: "Failed to update purchase",
				};
			}

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
					trx,
				);
				// we revoke in db first so if it fails we can rollback (we can't roll back stripe state if db fails)
				after(async () => { // we don't have to wait for stripe cleanup on their system for refund
					await stripeServerClient.refunds.create({
						payment_intent:
							typeof session.payment_intent === "string" // it means that it is id
								? session.payment_intent
								: session.payment_intent?.id,
					});
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
