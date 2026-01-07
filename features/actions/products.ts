"use server";

import z from "zod";
import { productSchema } from "@/data/zodSchema/product";
import { userRolesType } from "@/drizzle/schema";
import { getCurrentUser } from "../users/db/clerk";
import {
	eliminateProduct,
	insertProduct,
	updateProduct,
} from "../products/db/product";
import { revalidateProductCache } from "../products/db/cache";
import { revalidatePath } from "next/cache";
import { uploadImage } from "../imageKit";

export async function createProduct(unsafeData: z.infer<typeof productSchema>) {
	const { success, data } = productSchema.safeParse(unsafeData);

	if (!productPermission((await getCurrentUser()).role)) {
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
			imageUrl: imageUrl!,
			imageFileId: imageFileId!,
		});
		revalidateProductCache(product.id);
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
	unsafeData: Omit<z.infer<typeof productSchema>, "slug">
) {
	const { success, data } = productSchema.safeParse(unsafeData);

	if (!(await productPermission((await getCurrentUser()).role))) {
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
		const product = await updateProduct(id, {
			...data,
			imageUrl,
			imageFileId,
		});

		revalidatePath(`/admin/courses/${product.id}/edit`);
		revalidateProductCache(product.id);
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
	if (!productPermission((await getCurrentUser()).role)) {
		return {
			success: false,
			message: "You are not authorized to delete this product",
		};
	}

	try {
		await eliminateProduct(productId);

		revalidatePath(`/admin/products/`);
		revalidateProductCache(productId);
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Error Occurred while updating your product",
		};
	}

	return { success: true, message: "Successfully deleted your product" };
}

export async function productPermission(role: userRolesType | undefined) {
	return role === "admin";
}
