import { countryToCouponMap } from "@/data/pppCoupons";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COUNTRY_HEADER_KEY = "x-user-country";

const getUserCountry = async () => {
	const head = await headers();
	return head.get(COUNTRY_HEADER_KEY);
};

export async function GET(req: NextRequest) {
	const country = await getUserCountry();
	if (!country) return; // PPP system won't work with users using vpn or proxy

	// O(1) lookup using Map instead of O(n*m) with find + includes
	const coupon = countryToCouponMap.get(country);

	if (!coupon) return;

	return NextResponse.json(
		{
			stripeCouponId: coupon.stripeCouponId,
			discountPercentage: coupon.discountPercentage,
		},
		{ status: 200 },
	);
}
