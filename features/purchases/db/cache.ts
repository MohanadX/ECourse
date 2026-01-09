import { revalidateTag } from "next/cache";

export function getPurchasesGlobalTag() {
	return "purchases";
}

export function getPurchaseIdTag(purchaseId: string) {
	return `purchase:${purchaseId}`;
}

export function getPurchaseUserTag(userId: string) {
	return `purchase:user:${userId}`;
}

export function revalidatePurchasesCache(purchaseId: string, userId: string) {
	revalidateTag(getPurchasesGlobalTag(), "max");
	revalidateTag(getPurchaseIdTag(purchaseId), "max");
	revalidateTag(getPurchaseUserTag(userId), "max");
}
