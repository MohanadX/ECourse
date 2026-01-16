import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import ProductsTable from "@/components/products/ProductsTable";
import { db } from "@/drizzle/db";
import { cacheTag } from "next/cache";
import {
	CourseProductTable,
	ProductTable as DbProductTable,
	PurchaseTable,
} from "@/drizzle/schema";

import Link from "next/link";
import { asc, countDistinct, eq } from "drizzle-orm";

import { getUserProductsTag } from "@/features/products/db/cache";
import { getUserCoursesTag } from "@/features/course/db/cache";

const Products = async ({
	params,
}: {
	params: Promise<{ userId: string }>;
}) => {
	const { userId } = await params;
	const products = await getProducts(userId);
	return (
		<main className="containers mt-6">
			<PageHeader title="Products">
				<Button asChild variant={"default"}>
					<Link href={`/admin/${userId}/products/new`}>New Product</Link>
				</Button>
			</PageHeader>

			<article>
				<ProductsTable products={products}></ProductsTable>
			</article>
		</main>
	);
};

export default Products;

async function getProducts(userId: string) {
	"use cache";
	cacheTag(getUserProductsTag(userId), getUserCoursesTag(userId));

	return db
		.select({
			id: DbProductTable.id,
			name: DbProductTable.name,
			status: DbProductTable.status,
			priceInDollars: DbProductTable.priceInDollars,
			description: DbProductTable.description,
			imageUrl: DbProductTable.imageUrl,
			coursesCount: countDistinct(CourseProductTable.courseId),
			customersCount: countDistinct(PurchaseTable.userId),
		})
		.from(DbProductTable)
		.where(eq(DbProductTable.userId, userId))
		.leftJoin(PurchaseTable, eq(PurchaseTable.productId, DbProductTable.id))
		.leftJoin(
			CourseProductTable,
			eq(CourseProductTable.productId, DbProductTable.id)
		)
		.orderBy(asc(DbProductTable.name))
		.groupBy(DbProductTable.id);
}
