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

export function getUserAdminPurchasesTag(userId: string) {
	return `sales:user:${userId}`;
}

export function revalidatePurchasesCache({
	purchaseId,
	userId,
	adminId,
}: {
	purchaseId: string;
	userId: string;
	adminId: string | null;
}) {
	revalidateTag(getPurchasesGlobalTag(), "max");
	revalidateTag(getPurchaseIdTag(purchaseId), "max");
	revalidateTag(getPurchaseUserTag(userId), "max");
	if (adminId) revalidateTag(getUserAdminPurchasesTag(adminId), "max");
}
