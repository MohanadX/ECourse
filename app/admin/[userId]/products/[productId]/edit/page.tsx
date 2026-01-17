import PageHeader from "@/components/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { db } from "@/drizzle/db";
import { CourseTable, ProductTable } from "@/drizzle/schema";
import { getUserCoursesTag } from "@/features/course/db/cache";
import { getProductIdTag } from "@/features/products/db/cache";
import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";

const EditProductPage = async ({
	params,
}: {
	params: Promise<{ productId: string; userId: string }>;
}) => {
	const { productId, userId } = await params;

	const product = await getProduct(productId);

	if (!product) notFound();
	return (
		<main className="containers mt-6">
			<PageHeader title="Edit Product" />
			<ProductForm
				userId={userId}
				product={{
					...product,
					courseIds: product.CourseProducts.map((course) => course.courseId),
				}}
				courses={await getCourses(userId)}
			/>
		</main>
	);
};

export default EditProductPage;

async function getCourses(userId: string) {
	"use cache";
	cacheTag(getUserCoursesTag(userId));

	return db.query.CourseTable.findMany({
		where: eq(CourseTable.userId, userId),
		orderBy: asc(CourseTable.name),
		columns: { id: true, name: true },
	});
}

async function getProduct(productId: string) {
	"use cache";
	cacheTag(getProductIdTag(productId));

	return db.query.ProductTable.findFirst({
		where: eq(ProductTable.id, productId),
		columns: {
			id: true,
			name: true,
			description: true,
			imageUrl: true,
			status: true,
			priceInDollars: true,
		},
		with: {
			CourseProducts: {
				columns: { courseId: true },
			},
		},
	});
}
