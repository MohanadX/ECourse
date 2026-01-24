import PageHeader from "@/components/PageHeader";
import UserPurchaseTable from "@/components/purchases/UserPurchaseTable";
import UserPurchaseTableSkeleton from "@/components/purchases/UserPurchaseTableSkeleton";
import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { getPurchaseUserTag } from "@/features/purchases/db/cache";
import { getCurrentUser } from "@/features/users/db/clerk";
import { desc, eq, countDistinct } from "drizzle-orm";
import { cacheTag } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PURCHASES_LIMIT } from "@/data/zodSchema/purchase";

export default async function PurchaseHistoryPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { page: pageParam } = await searchParams;
	const page = Number(pageParam ?? 1);

	return (
		<main className="containers relative my-6">
			<PageHeader title="Purchase History" />
			<Suspense fallback={<UserPurchaseTableSkeleton />}>
				<SuspenseBoundary page={page} />
			</Suspense>
		</main>
	);
}

async function SuspenseBoundary({ page }: { page: number }) {
	const { userId, redirectToSignIn } = await getCurrentUser();

	if (!userId) return redirectToSignIn();

	const skip = (page - 1) * PURCHASES_LIMIT;

	const [purchases, [purchasesNumber]] = await getPurchases(
		userId,
		PURCHASES_LIMIT,
		skip,
	);
	const purchasesCount = purchasesNumber.purchasesCount ?? 0;

	const totalPages = Math.ceil(purchasesCount / PURCHASES_LIMIT);

	if (purchases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4">
				You have made no purchases yet
				<Button asChild size={"lg"}>
					<Link href={"/"}>Try Browsing Courses</Link>
				</Button>
			</div>
		);
	}

	return (
		<UserPurchaseTable
			initialPurchases={purchases}
			purchasesCount={purchasesCount}
			initialPage={page}
			totalPages={totalPages}
		/>
	);
}

async function getPurchases(userId: string, limit: number, skip: number) {
	"use cache";
	cacheTag(getPurchaseUserTag(userId));

	return Promise.all([
		db.query.PurchaseTable.findMany({
			columns: {
				id: true,
				pricePaidInCents: true,
				refundedAt: true,
				productDetails: true,
				createdAt: true,
			},
			where: eq(PurchaseTable.userId, userId),
			orderBy: desc(PurchaseTable.createdAt),
			limit,
			offset: skip,
		}),
		db
			.select({
				purchasesCount: countDistinct(PurchaseTable.id),
			})
			.from(PurchaseTable)
			.where(eq(PurchaseTable.userId, userId)),
	]);
}
