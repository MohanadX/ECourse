import { db } from "@/drizzle/db";
import {
	CourseProductTable,
	ProductTable,
	PurchaseTable,
} from "@/drizzle/schema";
import { slugifyName } from "@/features/course/db/course";
import { imageKit } from "@/features/imageKit";
import {
	getProductIdTag,
	getUserProductsTag,
} from "@/features/products/db/cache";
import { getPurchaseUserTag } from "@/features/purchases/db/cache";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

export async function insertProduct(
	data: Omit<typeof ProductTable.$inferInsert, "slug"> & {
		courseIds: string[];
	},
) {
	const newProduct = await db.transaction(async (trx) => {
		const slug = slugifyName(data.name);
		const [newProduct] = await trx
			.insert(ProductTable)
			.values({
				...data,
				slug,
			})
			.returning();
		if (!newProduct) {
			console.error("Failed to create your product");
			trx.rollback();
		}

		await trx.insert(CourseProductTable).values(
			data.courseIds.map((courseId) => ({
				productId: newProduct.id,
				courseId,
			})),
		);

		return newProduct;
	});

	return newProduct;
}

export async function updateProduct(
	id: string,
	data: Partial<typeof ProductTable.$inferInsert> & {
		courseIds: string[];
	},
	userId: string,
) {
	const updatedProduct = await db.transaction(async (trx) => {
		const slug = slugifyName(data.name!);
		const [updatedProduct] = await trx
			.update(ProductTable)
			.set({
				...data,
				slug,
			})
			.where(and(eq(ProductTable.id, id), eq(ProductTable.userId, userId)))
			.returning();
		if (!updatedProduct) {
			console.error("Failed to update your product");
			trx.rollback();
		}
		// delete the old stale product info from CourseProduct
		await trx
			.delete(CourseProductTable)
			.where(eq(CourseProductTable.productId, updatedProduct.id));

		await trx.insert(CourseProductTable).values(
			data.courseIds.map((courseId) => ({
				productId: updatedProduct.id,
				courseId,
			})),
		);

		return updatedProduct;
	});

	return updatedProduct;
}

export async function eliminateProduct(id: string, userId: string) {
	const [deletedProduct] = await db
		.delete(ProductTable)
		.where(and(eq(ProductTable.id, id), eq(ProductTable.userId, userId)))
		.returning();

	if (!deletedProduct) throw new Error("Failed to delete your product");

	// delete product image from imageKit cloud
	await imageKit.deleteFile(deletedProduct.imageFileId);
	return deletedProduct;
}

export const wherePublicProducts = eq(ProductTable.status, "public");

export async function userOwnsProduct({
	userId,
	productId,
}: {
	userId: string;
	productId: string;
}) {
	"use cache";
	cacheTag(getPurchaseUserTag(userId));

	const existingPurchase = await db.query.PurchaseTable.findFirst({
		where: and(
			eq(PurchaseTable.productId, productId),
			eq(PurchaseTable.userId, userId),
			isNull(PurchaseTable.refundedAt), // if user refunded product they can purchase it another time
		),
	});

	return existingPurchase != null;
}

export async function getUserProducts(userId: string) {
	"use cache";
	cacheTag(getUserProductsTag(userId));

	return await db.query.ProductTable.findMany({
		where: eq(ProductTable.userId, userId),
		orderBy: asc(ProductTable.name),
	});
}

export async function getProduct(id: string, userId: string) {
	"use cache";
	cacheTag(getProductIdTag(id));

	return await db.query.ProductTable.findFirst({
		columns: { id: true, name: true, userId: true },
		where: and(eq(ProductTable.id, id), eq(ProductTable.userId, userId)),
	});
}

export function formatNumber(
	number: number,
	options?: Intl.NumberFormatOptions,
) {
	const formatter = new Intl.NumberFormat(undefined, options);
	return formatter.format(number);
}
