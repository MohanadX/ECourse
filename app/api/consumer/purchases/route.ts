import { PURCHASES_LIMIT } from "@/data/zodSchema/purchase";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { getCurrentUser } from "@/features/users/db/clerk";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const page = Number(req.nextUrl.searchParams.get("page"));
		const { userId } = await getCurrentUser();

		if (!userId) {
			return NextResponse.json(null, { status: 401 });
		}

		const skip = (page - 1) * PURCHASES_LIMIT;
		const purchases = await db.query.PurchaseTable.findMany({
			columns: {
				id: true,
				pricePaidInCents: true,
				refundedAt: true,
				productDetails: true,
				createdAt: true,
			},
			where: eq(PurchaseTable.userId, userId),
			orderBy: desc(PurchaseTable.createdAt),
			limit: PURCHASES_LIMIT,
			offset: skip,
		});

		if (!purchases) {
			return NextResponse.json(null, { status: 204 });
		}

		return NextResponse.json(purchases, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(null, { status: 500 });
	}
}
