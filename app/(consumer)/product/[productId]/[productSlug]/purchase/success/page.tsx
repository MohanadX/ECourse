import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import { ProductTable } from "@/drizzle/schema";
import { getProductIdTag } from "@/features/products/db/cache";
import { wherePublicProducts } from "@/features/products/db/product";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

export default async function ProductPurchaseSuccessPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;

	const product = await getPublicProduct(productId);

	if (!product) return;

	return (
		<main className="containers my-6">
			<article className="flex justify-between items-center gap-4 max-md:flex-col-reverse">
				<div>
					<h1 className="text-4xl font-semibold">Purchase Successful</h1>
					<p className="text-xl my-8">Thank for purchasing {product.name}</p>
					<Button className="text-xl py-4 h-auto px-8 rounded-lg" asChild>
						<Link href={"/courses"}>View My Courses</Link>
					</Button>
				</div>
				<div className="relative aspect-video max-w-lg grow max-md:w-full">
					<Image
						src={product.imageUrl}
						alt={product.name}
						fill
						className="object-cover rounded-lg"
					/>
				</div>
			</article>
		</main>
	);
}

async function getPublicProduct(productId: string) {
	"use cache";
	cacheTag(getProductIdTag(productId));

	return db.query.ProductTable.findFirst({
		columns: {
			name: true,
			imageUrl: true,
		},
		where: and(eq(ProductTable.id, productId), wherePublicProducts),
	});
}
