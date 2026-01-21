"use client";

import { env } from "@/data/env/client";
import { formatPrice } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";

async function fetchUserCoupon() {
	const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/coupon`); // to make fetch happen async after rendering not during it

	if (!res.ok || !res.body) {
		return null;
	}
	return res.json();
}

const Price = ({ price }: { price: number }) => {
	const { data: coupon } = useSuspenseQuery({
		// query synchronously
		queryKey: ["coupon"],
		queryFn: fetchUserCoupon,
		staleTime: Infinity,
		refetchOnWindowFocus: true,
	});

	if (coupon == null || price === 0) {
		return formatPrice(price);
	}
	return (
		<div className="flex gap-2 items-baseline">
			<div className="line-through text-xs opacity-50">
				{formatPrice(price)}
			</div>
			<div>{formatPrice(price * (1 - coupon.discountPercentage))}</div>
		</div>
	);
};

export default Price;
