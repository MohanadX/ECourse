import { userOwnsProduct } from "@/features/products/db/product";
import { getCurrentUser } from "@/features/users/db/clerk";
import { Button } from "../ui/button";
import Link from "next/link";

const PurchaseButton = async ({ productId }: { productId: string }) => {
	const { userId } = await getCurrentUser();

	const alreadyOwnProduct =
		userId != null && (await userOwnsProduct({ userId, productId }));

	if (alreadyOwnProduct) {
		return <p>You already own this product</p>;
	} else {
		return (
			<Button className="text-xl h-auto py-4 px-8 rounded-lg" asChild>
				<Link href={`/product/${productId}/purchase`}>Get Now</Link>
			</Button>
		);
	}
};

export default PurchaseButton;
