"use client";

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
import { formatPlural } from "@/lib/utils";
import ActionButton from "../ActionButton";
import { refundPurchase } from "@/features/actions/purchase";
import Pagination from "../Pagination";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PURCHASES_LIMIT } from "@/data/zodSchema/purchase";
import { env } from "@/data/env/client";
import axios from "axios";

type Purchase = {
	id: string;
	pricePaidInCents: number;
	createdAt: Date;
	refundedAt: Date | null;
	productDetails: {
		name: string;
		description: string;
		imageUrl: string;
	};
	user: {
		name: string;
	};
};

type Props = {
	initialPurchases: Purchase[];
	purchasesCount: number;
	initialPage: number;
	totalPages: number;
};

async function getSalesPaginated(page: number): Promise<Purchase[]> {
	const res = await axios.get<Purchase[]>(
		`${env.NEXT_PUBLIC_SERVER_URL}/api/admin/sales`,
		{
			params: {
				page,
			},
		},
	);

	return res.data;
}

export default function PurchaseTable({
	initialPurchases,
	purchasesCount,
	initialPage,
	totalPages,
}: Props) {
	const [page, setPage] = useState(initialPage);

	const { data: purchases, isFetching } = useQuery<Purchase[]>({
		queryKey: ["salesP", page],
		queryFn: () => getSalesPaginated(page),
		initialData: page === initialPage ? initialPurchases : undefined,
		staleTime: 60 * 1000 * 5, // 5 min
		placeholderData: keepPreviousData,
	});

	return (
		<>
			<Table className="min-w-[500px]">
				<TableHeader>
					<TableRow>
						<TableHead>
							{formatPlural(purchases!.length, {
								singular: "Sale",
								plural: "Sales",
							})}
						</TableHead>
						<TableHead>Customer Name</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{purchases!.map((purchase) => (
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
							<TableCell>{purchase.user.name}</TableCell>
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
								{purchase.refundedAt == null &&
									purchase.pricePaidInCents > 0 && (
										<ActionButton
											pagination={["salesP", page]}
											action={refundPurchase.bind(null, purchase.id)}
											variant={"destructiveOutline"}
											requireAreYouSure
										>
											Refund
										</ActionButton>
									)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{purchasesCount > PURCHASES_LIMIT && (
				<div className="mx-auto w-fit">
					<Pagination
						currentPage={page}
						totalPages={totalPages}
						setPage={setPage}
					/>
					{isFetching && (
						<div className="load">
							<div className="circle l1"></div>
							<div className="circle l2"></div>
							<div className="circle l3"></div>
							<div className="circle l4"></div>
						</div>
					)}
				</div>
			)}
		</>
	);
}
