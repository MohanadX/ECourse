import PageHeader from "@/components/PageHeader";
import PurchaseTable from "@/components/purchases/PurchaseTable";
import { PurchaseTable as DbPurchaseTable } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { getUserAdminPurchasesTag } from "@/features/purchases/db/cache";
import { getUsersGlobalTag } from "@/features/users/db/cache";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getUserProductsTag } from "@/features/products/db/cache";

export default async function SalesPage({
	params,
}: {
	params: Promise<{ userId: string }>;
}) {
	const { userId } = await params;
	const sales = await getSales(userId);

	return (
		<main className="containers my-6">
			<PageHeader title="Sales" />
			<PurchaseTable purchases={sales} />
		</main>
	);
}

async function getSales(userId: string) {
	"use cache";
	cacheTag(
		getUserAdminPurchasesTag(userId),
		getUsersGlobalTag(),
		getUserProductsTag(userId)
	);

	return db.query.PurchaseTable.findMany({
		columns: {
			id: true,
			pricePaidInCents: true,
			refundedAt: true,
			productDetails: true,
			createdAt: true,
		},
		where: eq(DbPurchaseTable.adminId, userId),
		orderBy: desc(DbPurchaseTable.createdAt),
		with: {
			user: {
				columns: {
					name: true,
				},
			},
		},
	});
}
