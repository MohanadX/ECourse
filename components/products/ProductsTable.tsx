"use client";

import { formatPlural } from "@/lib/utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import Link from "next/link";
import { EyeIcon, LockIcon, Trash2Icon } from "lucide-react";
import ActionButton from "../ActionButton";
import { ProductStatus } from "@/drizzle/schema";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { deleteProduct } from "@/features/actions/products";
import Pagination from "../Pagination";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PRODUCTS_LIMIT } from "@/data/zodSchema/product";
import { env } from "@/data/env/client";

import axios from "axios";

export type Product = {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	priceInDollars: number;
	status: ProductStatus;
	coursesCount: number;
	customersCount: number;
};

type Props = {
	initialProducts: Product[];
	productsCount: number;
	initialPage: number;
	totalPages: number;
};

async function getProductsPaginated(page: number): Promise<Product[]> {
	const res = await axios.get<Product[]>(
		`${env.NEXT_PUBLIC_SERVER_URL}/api/admin/products`,
		{
			params: {
				page,
			},
		},
	);

	return res.data;
}

const ProductsTable = ({
	initialProducts,
	productsCount,
	initialPage,
	totalPages,
}: Props) => {
	const [page, setPage] = useState(initialPage);

	const { data: products, isFetching } = useQuery<Product[]>({
		queryKey: ["productsP", page],
		queryFn: () => getProductsPaginated(page),
		initialData: page === initialPage ? initialProducts : undefined,
		staleTime: 60 * 1000 * 5, // 5 min
		placeholderData: keepPreviousData,
	});

	return (
		<>
			<Table className="min-w-[500px]">
				<TableHeader>
					<TableRow>
						<TableHead>
							{formatPlural(products!.length, {
								singular: "Product",
								plural: "Products",
							})}
						</TableHead>
						<TableHead className="text-center">Customers</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{products!.map((product) => (
						<TableRow key={product.id}>
							<TableCell>
								<div className="flex items-center gap-4">
									<Image
										className="object-cover rounded size-12"
										src={product.imageUrl}
										alt={product.name}
										width={192}
										height={192}
									/>
									<div className="flex flex-col gap-1">
										<p className="font-semibold">{product.name}</p>
										<p
											className="text-muted-foreground"
											suppressHydrationWarning
										>
											{formatPlural(product.coursesCount, {
												singular: "Course",
												plural: "Courses",
											})}{" "}
											• {formatPrice(product.priceInDollars)}
										</p>
									</div>
								</div>
							</TableCell>
							<TableCell className="text-center">
								{product.customersCount}
							</TableCell>
							<TableCell>
								<Badge className="inline-flex items-center gap-2">
									{getStatusIcon(product.status)} {product.status}
								</Badge>
							</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button asChild>
										<Link href={`products/${product.id}/edit`}>Edit</Link>
									</Button>
									<ActionButton
										className="cursor-pointer"
										pagination={["productsP", page]}
										requireAreYouSure
										variant={"destructiveOutline"}
										action={deleteProduct.bind(null, product.id)}
										aria-label="Delete"
									>
										<Trash2Icon />
									</ActionButton>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{productsCount > PRODUCTS_LIMIT && (
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
};

export default ProductsTable;

function getStatusIcon(status: ProductStatus) {
	const Icon = {
		public: EyeIcon,
		private: LockIcon,
	}[status];

	return <Icon className="size-4" />;
}
