import Image from "next/image";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { formatDate } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { formatPrice } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";

export default function UserPurchaseTable({
	purchases,
}: {
	purchases: {
		id: string;
		pricePaidInCents: number;
		createdAt: Date;
		refundedAt: Date | null;
		productDetails: {
			name: string;
			description: string;
			imageUrl: string;
		};
	}[];
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{purchases.map((purchase) => (
					<TableRow key={purchase.id}>
						<TableCell>
							<article className="flex items-center gap-4">
								<Image
									className="object-cover rounded"
									src={purchase.productDetails.imageUrl}
									alt={purchase.productDetails.name}
									width={48}
									height={48}
								/>
								<div>
									<p>{purchase.productDetails.name}</p>
									<p>{formatDate(purchase.createdAt)}</p>
								</div>
							</article>
						</TableCell>
						<TableCell>
							{purchase.refundedAt ? (
								<Badge variant={"outline"} className="p-1 relative right-1">
									Refunded
								</Badge>
							) : (
								formatPrice(purchase.pricePaidInCents / 100)
							)}
						</TableCell>
						<TableCell className="p-0">
							<Button asChild variant={"outline"}>
								<Link href={`/purchases/${purchase.id}`}>Details</Link>
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
