import { revalidateTag } from "next/cache";

export function getProductsGlobalTag() {
	return "products";
}

export function getProductIdTag(productId: string) {
	return `product:${productId}`;
}

export function revalidateProductCache(productId: string) {
	revalidateTag(getProductsGlobalTag(), "max");
	revalidateTag(getProductIdTag(productId), "max");
}
