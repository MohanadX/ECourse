import SkeletonButton, { SkeletonArray, SkeletonText } from "../Skeletons";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

export default function UserPurchaseTableSkeleton() {
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
				<SkeletonArray amount={3}>
					<TableRow>
						<TableCell>
							<article className="flex items-center gap-4">
								<div className="size-12 bg-secondary animate-pulse rounded" />
								<div className="flex flex-col gap-1">
									<SkeletonText className="w-36" />
									<SkeletonText className="w-3/4" />
								</div>
							</article>
						</TableCell>
						<TableCell>
							<SkeletonText className="w-12" />
						</TableCell>
						<TableCell>
							<SkeletonButton />
						</TableCell>
					</TableRow>
				</SkeletonArray>
			</TableBody>
		</Table>
	);
}
