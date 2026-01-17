import { formatPlural } from "@/features/course/db/course";
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
import { formatPrice } from "@/features/products/db/product";
import { Badge } from "../ui/badge";
import { deleteProduct } from "@/features/actions/products";

type Props = {
	products: {
		id: string;
		name: string;
		description: string;
		imageUrl: string;
		priceInDollars: number;
		status: ProductStatus;
		coursesCount: number;
		customersCount: number;
	}[];
};

const ProductsTable = ({ products }: Props) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						{formatPlural(products.length, {
							singular: "Product",
							plural: "Products",
						})}
					</TableHead>
					<TableHead>Customers</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{products.map((product) => (
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
									<p className="text-muted-foreground">
										{formatPlural(product.coursesCount, {
											singular: "Course",
											plural: "Courses",
										})}{" "}
										• {formatPrice(product.priceInDollars)}
									</p>
								</div>
							</div>
						</TableCell>
						<TableCell>{product.customersCount}</TableCell>
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
