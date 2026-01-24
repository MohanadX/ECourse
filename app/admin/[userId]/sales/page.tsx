import PageHeader from "@/components/PageHeader";
import PurchaseTable from "@/components/purchases/PurchaseTable";
import { PurchaseTable as DbPurchaseTable } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { getUserAdminPurchasesTag } from "@/features/purchases/db/cache";
import { getUsersGlobalTag } from "@/features/users/db/cache";
import { desc, eq, countDistinct } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getUserProductsTag } from "@/features/products/db/cache";
import { PURCHASES_LIMIT } from "@/data/zodSchema/purchase";

export default async function SalesPage({
	params,
	searchParams,
}: {
	params: Promise<{ userId: string }>;
	searchParams: Promise<{ page?: string }>;
}) {
	const { userId } = await params;

	const { page: pageParam } = await searchParams;
	const page = Number(pageParam ?? 1);
	const skip = (page - 1) * PURCHASES_LIMIT;

	const [sales, [salesNumber]] = await getSales(userId, PURCHASES_LIMIT, skip);
	const salesCount = salesNumber.salesCount ?? 0;

	const totalPages = Math.ceil(salesCount / PURCHASES_LIMIT);

	return (
		<main className="containers my-6">
			<PageHeader title="Sales" />
			<PurchaseTable
				initialPurchases={sales}
				purchasesCount={salesCount}
				initialPage={page}
				totalPages={totalPages}
			/>
		</main>
	);
}

async function getSales(userId: string, limit: number, skip: number) {
	"use cache";
	cacheTag(
		getUserAdminPurchasesTag(userId),
		getUsersGlobalTag(),
		getUserProductsTag(userId),
	);

	return Promise.all([
		db.query.PurchaseTable.findMany({
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
			limit,
			offset: skip,
		}),
		db
			.select({
				salesCount: countDistinct(DbPurchaseTable.id),
			})
			.from(DbPurchaseTable)
			.where(eq(DbPurchaseTable.adminId, userId)),
	]);
}
