import { pppCoupons } from "@/data/pppCoupons";
import { headers } from "next/headers";

const COUNTRY_HEADER_KEY = "x-user-country";
export function setUserCountryHeaders(
	headers: Headers,
	country: string | undefined
) {
	if (!country) {
		headers.delete(COUNTRY_HEADER_KEY);
	} else {
		headers.set(COUNTRY_HEADER_KEY, country);
	}
}

const getUserCountry = async () => {
	const head = await headers();
	return head.get(COUNTRY_HEADER_KEY);
};

export async function getUserCoupon() {
	const country = await getUserCountry();
	if (!country) return; // PPP system won't work with users using vpn or proxy

	const coupon = pppCoupons.find((coupon) =>
		coupon.countryCodes.includes(country)
	);

	if (!coupon) return;

	return {
		stripCouponId: coupon.stripeCouponId,
		discountPercentage: coupon.discountPercentage,
	};
}
