import { db } from "@/drizzle/db";
import { ProductTable, UserCourseAccessTable } from "@/drizzle/schema";
import { revalidateUserCourseAccessCache } from "./CourseAccessCache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { PurchaseTable } from "@/drizzle/schema";

export async function addUserCourseAccess(
	{
		userId,
		courseIds,
	}: {
		userId: string;
		courseIds: string[];
	},
	trx: Omit<typeof db, "$client"> = db
) {
	if (courseIds.length === 0) {
		return [];
	}
	const accesses = await trx
		.insert(UserCourseAccessTable)
		.values(
			courseIds.map((courseId) => ({
				userId,
				courseId,
			}))
		)
		.onConflictDoNothing()
		.returning();

	accesses.forEach(revalidateUserCourseAccessCache);

	return accesses;
}

/**
 when user refund a product we revoke his access to all that product courses.
 unless they have bought another product that have a shared course that won't be touched 
 */
export async function revokeUserCourseAccess(
	{
		userId,
		productId,
	}: {
		userId: string;
		productId: string;
	},
	trx: Omit<typeof db, "$client"> = db
) {
	const validPurchases = await trx.query.PurchaseTable.findMany({
		where: and(
			eq(PurchaseTable.userId, userId),
			isNull(PurchaseTable.refundedAt)
		), // all purchase that are not refunded
		with: {
			product: {
				with: {
					CourseProducts: { columns: { courseId: true } },
				},
			},
		},
	});

	const refundPurchase = await trx.query.ProductTable.findFirst({
		where: eq(ProductTable.id, productId),
		with: {
			CourseProducts: {
				columns: { courseId: true },
			},
		},
	});

	if (!refundPurchase) return;

	const validCourseIds = validPurchases.flatMap((p) =>
		p.product.CourseProducts.map((cp) => cp.courseId)
	);

	const removeCourseIds = refundPurchase.CourseProducts.flatMap(
		(cp) => cp.courseId
	).filter((courseId) => !validCourseIds.includes(courseId));

	const revokedAccesses = await trx
		.delete(UserCourseAccessTable)
		.where(
			and(
				eq(UserCourseAccessTable.userId, userId),
				inArray(UserCourseAccessTable.courseId, removeCourseIds)
			)
		)
		.returning();

	revokedAccesses.forEach(revalidateUserCourseAccessCache);

	return revokedAccesses;
}
