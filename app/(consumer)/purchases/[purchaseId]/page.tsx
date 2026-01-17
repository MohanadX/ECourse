import PageLoader from "@/app/loading";
import ActionButton from "@/components/ActionButton";
import PageHeader from "@/components/PageHeader";
import PurchaseRefundTimer from "@/components/purchases/PurchaseRefundTimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import { PurchaseTable } from "@/drizzle/schema";
import { refundPurchase } from "@/features/actions/purchase";
import { formatPrice } from "@/features/products/db/product";
import { getPurchaseIdTag } from "@/features/purchases/db/cache";
import { getCurrentUser } from "@/features/users/db/clerk";
import { cn, expireRefundPurchaseDate, formatDate } from "@/lib/utils";
import { stripeServerClient } from "@/StripeServer";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import Stripe from "stripe";

export default async function PurchaseIdPage({
	params,
}: {
	params: Promise<{ purchaseId: string }>;
}) {
	const { purchaseId } = await params;

	return (
		<main className="containers my-6">
			<Suspense fallback={<PageLoader className="min-h-[90vh]" />}>
				<SuspendedComponent purchaseId={purchaseId} />
			</Suspense>
		</main>
	);
}

async function SuspendedComponent({ purchaseId }: { purchaseId: string }) {
	const { userId, redirectToSignIn, user } = await getCurrentUser({
		allData: true,
	});

	if (!userId || !user) return redirectToSignIn();

	const purchase = await getPurchase(purchaseId, userId);

	if (!purchase) notFound();

	const { receiptUrl, pricingRows } = await getStripeDetails(
		purchase.stripeSessionId,
		purchase.pricePaidInCents,
		purchase.refundedAt != null,
	);

	// console.log(pricingRows);
	const { isExpired } = expireRefundPurchaseDate(purchase.createdAt);
	return (
		<>
			<PageHeader title={purchase.productDetails.name}>
				{receiptUrl && (
					<Button variant={"outline"} asChild>
						<Link target="_blank" href={receiptUrl}>
							View Receipt
						</Link>
					</Button>
				)}
			</PageHeader>
			<Card>
				<CardHeader className="pb-4">
					<div className="flex justify-between items-start gap-4">
						<div className="flex flex-col gap-1">
							<CardTitle>Receipt</CardTitle>
							<CardDescription>ID: {purchaseId}</CardDescription>
						</div>
						<Badge className="text-base rounded-sm">
							{purchase.refundedAt ? "Refunded" : "Paid"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="py-4 grid grid-cols-2 gap-8 border-t ">
					<div>
						<label className="text-sm text-muted-foreground">Date</label>
						<p>{formatDate(purchase.createdAt)}</p>
					</div>
					<div>
						<label className="text-sm text-muted-foreground">Product</label>
						<p>{purchase.productDetails.name}</p>
					</div>
					<div>
						<label className="text-sm text-muted-foreground">Customer</label>
						<p>{user.name}</p>
					</div>
					<div>
						<label className="text-sm text-muted-foreground">Platform</label>
						<p>ECourse Platform</p>
					</div>
				</CardContent>
				<CardFooter className="grid grid-cols-2 gap-y-4 gap-x-8 border-t pt-4">
					{pricingRows.map(({ label, amountInDollars, isBold }) => (
						<Fragment key={label}>
							<p className={cn(isBold && "font-bold")}>{label}</p>
							<p className={cn("justify-self-end", isBold && "font-bold")}>
								{formatPrice(amountInDollars, { showZeroAsNumber: true })}
							</p>
						</Fragment>
					))}
					<div>
						{!isExpired && !purchase.refundedAt && (
							<div className="flex gap-2 items-center">
								<ActionButton
									variant={"destructiveOutline"}
									action={refundPurchase.bind(null, purchaseId)}
									requireAreYouSure
									className="w-fit"
								>
									Refund
								</ActionButton>
								<PurchaseRefundTimer purchaseTime={purchase.createdAt} />
							</div>
						)}
						<p className="mt-2">
							{purchase.refundedAt
								? "You have refunded this purchase previously"
								: isExpired
									? "The purchase refund date has expired. You can no longer refund this purchase"
									: "You can refund this purchase within the refund period."}
						</p>
					</div>
				</CardFooter>
			</Card>
		</>
	);
}

async function getPurchase(purchaseId: string, userId: string) {
	"use cache";
	cacheTag(getPurchaseIdTag(purchaseId));

	return db.query.PurchaseTable.findFirst({
		columns: {
			pricePaidInCents: true,
			refundedAt: true,
			productDetails: true,
			createdAt: true,
			stripeSessionId: true,
		},
		where: and(
			eq(PurchaseTable.id, purchaseId),
			eq(PurchaseTable.userId, userId),
		),
	});
}

async function getStripeDetails(
	stripeSessionId: string,
	pricePaidInCents: number,
	isRefunded: boolean,
) {
	const { payment_intent, total_details, amount_total, amount_subtotal } =
		await stripeServerClient.checkout.sessions.retrieve(stripeSessionId, {
			expand: [
				"payment_intent.latest_charge",
				"total_details.breakdown.discounts",
			],
		});
	const refundAmount =
		typeof payment_intent !== "string" &&
		typeof payment_intent?.latest_charge !== "string"
			? payment_intent?.latest_charge?.amount_refunded
			: isRefunded
				? pricePaidInCents
				: undefined;
	// check the refunded price in stripe then my db

	return {
		receiptUrl: getReceiptUrl(payment_intent),
		pricingRows: await getPricingRows(total_details, {
			total: (amount_total ?? pricePaidInCents) - (refundAmount ?? 0),
			subtotal: amount_subtotal ?? pricePaidInCents,
			refund: refundAmount,
		}),
	};
}

function getReceiptUrl(payment_intent: Stripe.PaymentIntent | string | null) {
	if (
		typeof payment_intent === "string" ||
		typeof payment_intent?.latest_charge === "string"
	) {
		return;
	}

	return payment_intent?.latest_charge?.receipt_url;
}

/**
This function constructs a UI-ready list of pricing rows (subtotal, applied coupon discounts, refunds, and total) from Stripe Checkout Session totals.
safely handling expanded coupon data and converting amounts from cents to display values.
pricingRows is array in case we added additional coupons
*/
async function getPricingRows(
	totalDetails: Stripe.Checkout.Session.TotalDetails | null,
	{
		total,
		subtotal,
		refund,
	}: { total: number; subtotal: number; refund?: number },
) {
	const pricingRows: {
		label: string;
		amountInDollars: number;
		isBold?: boolean;
	}[] = [];

	if (totalDetails?.breakdown) {
		for (const discount of totalDetails.breakdown.discounts) {
			const source = discount.discount.source;

			if (
				source?.type === "coupon" &&
				source.coupon &&
				typeof source.coupon === "string"
			) {
				const coupon = await stripeServerClient.coupons.retrieve(source.coupon);

				pricingRows.push({
					label: `${coupon.name} ${coupon.percent_off}% off`,
					amountInDollars: discount.amount / -100,
				});
			}
		}
	}

	if (refund) {
		pricingRows.push({
			label: "Refund",
			amountInDollars: refund / -100,
		});
	}

	if (pricingRows.length === 0) {
		return [{ label: "Total", amountInDollars: total / 100, isBold: true }];
	}

	return [
		{
			label: "Subtotal",
			amountInDollars: subtotal / 100,
		},
		...pricingRows,
		{
			label: "Total",
			amountInDollars: total / 100,
			isBold: true,
		},
	];
}
