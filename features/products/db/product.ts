import { db } from "@/drizzle/db";
import { CourseProductTable, ProductTable } from "@/drizzle/schema";
import { slugifyName } from "@/features/course/db/course";
import { imageKit } from "@/features/imageKit";
import { eq } from "drizzle-orm";

export async function insertProduct(
	data: Omit<typeof ProductTable.$inferInsert, "slug"> & {
		courseIds: string[];
	}
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
			}))
		);

		return newProduct;
	});

	return newProduct;
}

export async function updateProduct(
	id: string,
	data: Partial<typeof ProductTable.$inferInsert> & {
		courseIds: string[];
	}
) {
	const updatedProduct = await db.transaction(async (trx) => {
		const slug = slugifyName(data.name!);
		const [updatedProduct] = await trx
			.update(ProductTable)
			.set({
				...data,
				slug,
			})
			.where(eq(ProductTable.id, id))
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
			}))
		);

		return updatedProduct;
	});

	return updatedProduct;
}

export async function eliminateProduct(id: string) {
	const [deletedProduct] = await db
		.delete(ProductTable)
		.where(eq(ProductTable.id, id))
		.returning();

	if (!deletedProduct) throw new Error("Failed to delete your course");

	// delete product image from imageKit cloud
	await imageKit.deleteFile(deletedProduct.imageFileId);
	return deletedProduct;
}

export async function formatPrice(
	amount: number,
	{ showZeroAsNumber = false } = {}
) {
	const formatter = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
	});

	if (amount === 0 && !showZeroAsNumber) return "Free";
	return formatter.format(amount);
}
