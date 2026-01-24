import { PURCHASES_LIMIT } from "@/data/zodSchema/purchase";
import { db } from "@/drizzle/db";
import { PurchaseTable as DbPurchaseTable } from "@/drizzle/schema";
import { getCurrentUser } from "@/features/users/db/clerk";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const page = Number(req.nextUrl.searchParams.get("page")) || 1;
		const { userId, role } = await getCurrentUser();

		if (!userId || role !== "admin") {
			return NextResponse.json(null, { status: 401 });
		}

		const skip = (page - 1) * PURCHASES_LIMIT;
		const sales = await db.query.PurchaseTable.findMany({
			columns: {
				id: true,
				pricePaidInCents: true,
				refundedAt: true,
				productDetails: true,
				createdAt: true,
			},
			where: eq(DbPurchaseTable.adminId, userId),
			orderBy: desc(DbPurchaseTable.createdAt),
			with: {
				user: {
					columns: {
						name: true,
					},
				},
			},
			limit: PURCHASES_LIMIT,
			offset: skip,
		});

		if (!sales) {
			return NextResponse.json([], { status: 204 });
		}

		return NextResponse.json(sales, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(null, { status: 500 });
	}
}
