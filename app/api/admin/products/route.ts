import { PRODUCTS_LIMIT } from "@/data/zodSchema/product";
import { db } from "@/drizzle/db";
import {
	CourseProductTable,
	ProductTable,
	PurchaseTable,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/features/users/db/clerk";
import { asc, countDistinct, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const page = Number(req.nextUrl.searchParams.get("page")) || 1;
		const { userId } = await getCurrentUser();

		if (!userId) {
			return NextResponse.json(null, { status: 401 });
		}

		const skip = Math.max(0, (page - 1) * PRODUCTS_LIMIT);
		const products = await db
			.select({
				id: ProductTable.id,
				name: ProductTable.name,
				status: ProductTable.status,
				priceInDollars: ProductTable.priceInDollars,
				description: ProductTable.description,
				imageUrl: ProductTable.imageUrl,
				coursesCount: countDistinct(CourseProductTable.courseId),
				customersCount: countDistinct(PurchaseTable.userId),
			})
			.from(ProductTable)
			.where(eq(ProductTable.userId, userId))
			.leftJoin(PurchaseTable, eq(PurchaseTable.productId, ProductTable.id))
			.leftJoin(
				CourseProductTable,
				eq(CourseProductTable.productId, ProductTable.id),
			)
			.orderBy(asc(ProductTable.name))
			.groupBy(ProductTable.id)
			.limit(PRODUCTS_LIMIT)
			.offset(skip);

		if (!products) {
			return NextResponse.json(null, { status: 204 });
		}

		return NextResponse.json(products, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(null, { status: 500 });
	}
}
