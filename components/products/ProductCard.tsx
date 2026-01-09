import Image from "next/image";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Suspense } from "react";
import Price from "./Price";
import { Button } from "../ui/button";
import Link from "next/link";

export function ProductCard({
	id,
	name,
	description,
	imageUrl,
	priceInDollars,
}: {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	priceInDollars: number;
}) {
	return (
		<Card className="overflow-hidden pt-0 flex flex-col w-full max-w-[500px] mx-auto">
			<div className="relative aspect-video">
				<Image src={imageUrl} alt={name} fill className="object-cover" />
			</div>

			<CardHeader className="space-y-0">
				<CardDescription>
					<Suspense>
						<Price price={priceInDollars} />
					</Suspense>
				</CardDescription>
				<CardTitle className="text-xl">{name}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="line-clamp-3">{description}</p>
			</CardContent>
			<CardFooter className="mt-auto">
				<Button className="w-full py-3" asChild>
					<Link href={`/product/${id}`}>View Course</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
