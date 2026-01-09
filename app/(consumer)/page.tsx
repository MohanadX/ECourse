import { ProductCard } from "@/components/products/ProductCard";
import { db } from "@/drizzle/db";
import { ProductTable } from "@/drizzle/schema";
import { getProductsGlobalTag } from "@/features/products/db/cache";
import { wherePublicProducts } from "@/features/products/db/product";
import { asc } from "drizzle-orm";
import { cacheTag } from "next/cache";

export default async function Home() {
	const products = await getPublicProducts();
	return (
		<main className="containers my-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
			{products.map((product) => (
				<ProductCard key={product.id} {...product} />
			))}
		</main>
	);
}

async function getPublicProducts() {
	"use cache";
	cacheTag(getProductsGlobalTag());

	return db.query.ProductTable.findMany({
		columns: {
			id: true,
			name: true,
			description: true,
			priceInDollars: true,
			imageUrl: true,
		},
		where: wherePublicProducts,
		orderBy: asc(ProductTable.name),
	});
}
