"use server";

import z from "zod";
import { productSchema } from "@/data/zodSchema/product";
import { ProductTable, userRolesType } from "@/drizzle/schema";
import { getCurrentUser } from "../users/db/clerk";
import {
	eliminateProduct,
	getProduct,
	insertProduct,
	updateProduct,
	wherePublicProducts,
} from "../products/db/product";
import { revalidateProductCache } from "../products/db/cache";
import { revalidatePath } from "next/cache";
import { uploadImage } from "../imageKit";
import { asc, count } from "drizzle-orm";
import { db } from "@/drizzle/db";

export async function createProduct(unsafeData: z.infer<typeof productSchema>) {
	const { success, data } = productSchema.safeParse(unsafeData);

	const user = await getCurrentUser();
	if (!productPermission(user.role)) {
		console.error("You are not authorized to create a product");
		return {
			success: false,
			message: "You are not authorized to create a product",
		};
	} else if (!success) {
		console.error("Invalid inputs");
		return {
			success: false,
			message: "Invalid Inputs, please check the requirements",
		};
	}

	// Image Kit image validation
	const {
		success: uploadSuccess,
		message,
		imageUrl,
		imageFileId,
	} = await uploadImage(data.image);

	if (!uploadSuccess) {
		return {
			success: false,
			message,
		};
	}

	try {
		const product = await insertProduct({
			...data,
			userId: user.userId!,
			imageUrl: imageUrl!,
			imageFileId: imageFileId!,
		});
		revalidateProductCache(product.id, user.userId!);
		return {
			success: true,
			message: "Successfully created your product",
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Error Occurred while creating your product",
		};
	}
}

export async function mutateProduct(
	id: string,
	unsafeData: Partial<z.infer<typeof productSchema>>,
) {
	const { success, data } = productSchema.safeParse(unsafeData);

	const user = await getCurrentUser();

	if (!(await productPermission(user.role))) {
		console.error("You are not authorized to update this product");
		return {
			success: false,
			message: "You are not authorized to update this product",
		};
	} else if (!success) {
		console.error("Invalid inputs");
		return {
			success: false,
			message: "Invalid Inputs, please check the requirements",
		};
	}

	// Image Kit image validation
	const {
		success: uploadSuccess,
		message,
		imageUrl,
		imageFileId,
	} = await uploadImage(data.image);

	if (!uploadSuccess) {
		return {
			success: false,
			message,
		};
	}

	try {
		const product = await getProduct(id, user.userId!);
		if (!product || product.userId !== user.userId) {
			return {
				success: false,
				message: "You are not authorized to update this product",
			};
		}

		const updatedProduct = await updateProduct(
			id,
			{
				...data,
				imageUrl,
				imageFileId,
			},
			user.userId,
		);

		revalidatePath(`/admin/${user.userId}/products/${updatedProduct.id}/edit`);
		revalidateProductCache(updatedProduct.id, user.userId!);
		return {
			success: true,
			message: "Product Has been updated successfully",
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Error Occurred while updating your product",
		};
	}
}

export async function deleteProduct(productId: string) {
	const user = await getCurrentUser();
	if (!productPermission(user.role)) {
		return {
			success: false,
			message: "You are not authorized to delete this product",
		};
	}

	try {
		const product = await getProduct(productId, user.userId!);

		if (!product || product.userId !== user.userId) {
			return {
				success: false,
				message: "You are not authorized to delete this product",
			};
		}

		await eliminateProduct(productId, user.userId);

		revalidatePath(`/admin/${user.userId}/products/`);
		revalidateProductCache(productId, user.userId!);
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Error Occurred while deleting your product",
		};
	}

	return { success: true, message: "Successfully deleted your product" };
}

// Define a function that fetches a "page" of events
export async function fetchEProductsPage(params: { pageParam?: number }) {
	const skip = params.pageParam ?? 0;
	const limit = 8;

	const [products, [counts]] = await Promise.all([
		db.query.ProductTable.findMany({
			columns: {
				id: true,
				name: true,
				slug: true,
				description: true,
				priceInDollars: true,
				imageUrl: true,
			},
			where: wherePublicProducts,
			orderBy: asc(ProductTable.name),
			limit,
			offset: skip,
		}),
		db
			.select({
				totalProducts: count(ProductTable.id),
			})
			.from(ProductTable)
			.where(wherePublicProducts),
	]);

	const totalProducts = counts.totalProducts;
	// Figure out the next skip (i.e. next pageParam)
	const fullyLoaded = skip + products.length >= totalProducts;

	return {
		products,
		nextSkip: fullyLoaded ? null : skip + products.length,
	};
}

export async function productPermission(role: userRolesType | undefined) {
	return role === "admin";
}
