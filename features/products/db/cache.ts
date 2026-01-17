import { revalidateTag } from "next/cache";

export function getProductsGlobalTag() {
	return "globalProducts";
}

export function getUserProductsTag(userId: string) {
	return `user:${userId}:products`;
}

export function getProductIdTag(productId: string) {
	return `product:${productId}`;
}

export function revalidateProductCache(productId: string, userId: string) {
	revalidateTag(getProductsGlobalTag(), "max");
	revalidateTag(getUserProductsTag(userId), "max");
	revalidateTag(getProductIdTag(productId), "max");
}
