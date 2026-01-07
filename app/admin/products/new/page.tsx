import PageHeader from "@/components/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { db } from "@/drizzle/db";
import { CourseTable } from "@/drizzle/schema";
import { getCourseGlobalTag } from "@/features/course/db/cache";
import { asc } from "drizzle-orm";
import { cacheTag } from "next/cache";

const NewProductPage = async () => {
	return (
		<main className="containers mt-6">
			<PageHeader title="New Product" />
			<ProductForm courses={await getCourses()} />
		</main>
	);
};

export default NewProductPage;

async function getCourses() {
	"use cache";
	cacheTag(getCourseGlobalTag());

	return db.query.CourseTable.findMany({
		orderBy: asc(CourseTable.name),
		columns: { id: true, name: true },
	});
}
