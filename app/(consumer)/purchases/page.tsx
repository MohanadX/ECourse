import PageHeader from "@/components/PageHeader";
import UserPurchaseTable from "@/components/purchases/UserPurchaseTable";
import UserPurchaseTableSkeleton from "@/components/purchases/UserPurchaseTableSkeleton";
import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { getPurchaseUserTag } from "@/features/purchases/db/cache";
import { getCurrentUser } from "@/features/users/db/clerk";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";

export default async function PurchaseHistoryPage() {
	return (
		<main className="containers relative my-6">
			<PageHeader title="Purchase History" />
			<Suspense fallback={<UserPurchaseTableSkeleton />}>
				<SuspenseBoundary />
			</Suspense>
		</main>
	);
}

async function SuspenseBoundary() {
	const { userId, redirectToSignIn } = await getCurrentUser();

	if (!userId) return redirectToSignIn();

	const purchases = await getPurchases(userId);

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

	return <UserPurchaseTable purchases={purchases}></UserPurchaseTable>;
}

async function getPurchases(userId: string) {
	"use cache";
	cacheTag(getPurchaseUserTag(userId));

	return db.query.PurchaseTable.findMany({
		columns: {
			id: true,
			pricePaidInCents: true,
			refundedAt: true,
			productDetails: true,
			createdAt: true,
		},
		where: eq(PurchaseTable.userId, userId),
		orderBy: desc(PurchaseTable.createdAt),
	});
}
