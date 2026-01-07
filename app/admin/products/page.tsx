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

import { getProductsGlobalTag } from "@/features/products/db/cache";

const Products = async () => {
	const products = await getProducts();
	return (
		<main className="containers mt-6">
			<PageHeader title="Products">
				<Button asChild variant={"default"}>
					<Link href={"/admin/products/new"}>New Product</Link>
				</Button>
			</PageHeader>

			<article>
				<ProductsTable products={products}></ProductsTable>
			</article>
		</main>
	);
};

export default Products;

async function getProducts() {
	"use cache";
	cacheTag(getProductsGlobalTag());

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
		.leftJoin(PurchaseTable, eq(PurchaseTable.productId, DbProductTable.id))
		.leftJoin(
			CourseProductTable,
			eq(CourseProductTable.productId, DbProductTable.id)
		)
		.orderBy(asc(DbProductTable.name))
		.groupBy(DbProductTable.id);
}
