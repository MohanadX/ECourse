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
import { PRODUCTS_LIMIT } from "@/data/zodSchema/product";

const Products = async ({
	params,
	searchParams,
}: {
	params: Promise<{ userId: string }>;
	searchParams: Promise<{ page?: string }>;
}) => {
	const { userId } = await params;

	const { page: pageParam } = await searchParams;
	const page = Number(pageParam ?? 1);
	const skip = (page - 1) * PRODUCTS_LIMIT;

	const [products, [productsNumber]] = await getProducts(
		userId,
		PRODUCTS_LIMIT,
		skip,
	);
	const productsCount = productsNumber.productsCount ?? 0;

	const totalPages = Math.ceil(productsCount / PRODUCTS_LIMIT);

	return (
		<main className="containers mt-6">
			<PageHeader title="Products">
				<Button asChild variant={"default"}>
					<Link href={`/admin/${userId}/products/new`}>New Product</Link>
				</Button>
			</PageHeader>

			<article>
				<ProductsTable
					initialProducts={products}
					productsCount={productsCount}
					initialPage={page}
					totalPages={totalPages}
				/>
			</article>
		</main>
	);
};

export default Products;

async function getProducts(userId: string, limit: number, skip: number) {
	"use cache";
	cacheTag(getUserProductsTag(userId), getUserCoursesTag(userId));

	return Promise.all([
		db
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
				eq(CourseProductTable.productId, DbProductTable.id),
			)
			.orderBy(asc(DbProductTable.name))
			.groupBy(DbProductTable.id)
			.limit(limit)
			.offset(skip),
		db
			.select({
				productsCount: countDistinct(DbProductTable.id),
			})
			.from(DbProductTable)
			.where(eq(DbProductTable.userId, userId)),
	]);
}
