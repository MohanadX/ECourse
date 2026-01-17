import { formatPrice } from "@/features/products/db/product";
import { getUserCoupon } from "@/lib/pppFunctions";

const Price = async ({ price }: { price: number }) => {
	const coupon = price !== 0 ? await getUserCoupon() : null;

	if (price === 0 || coupon == null) {
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
