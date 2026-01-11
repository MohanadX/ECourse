import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProductPurchaseFailurePage() {
	return (
		<main className="containers my-6 flex flex-col gap-4 items-center justify-center">
			<h1 className="text-3xl font-semibold">Purchase Failed</h1>
			<p className="text-xl">there was a problem purchasing your product</p>
			<Button asChild className="text-xl h-auto py-4 px-8 rounded-lg">
				<Link href="/">Try again</Link>
			</Button>
		</main>
	);
}
