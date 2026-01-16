import PageHeader from "@/components/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { getUserCoursesTag } from "@/features/course/db/cache";
import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

const NewProductPage = async ({
	params,
}: {
	params: Promise<{ userId: string }>;
}) => {
	const { userId } = await params;
	return (
		<main className="containers mt-6">
			<PageHeader title="New Product" />
			<ProductForm userId={userId} courses={await getCourses(userId)} />
		</main>
	);
};

export default NewProductPage;

async function getCourses(userId: string) {
	"use cache";
	cacheTag(getUserCoursesTag(userId));

	return db.query.CourseTable.findMany({
		columns: { id: true, name: true },
		where: eq(CourseTable.userId, userId),
		orderBy: asc(CourseTable.name),
	});
}
