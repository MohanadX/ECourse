import PageLoader from "@/app/loading";
import PageHeader from "@/components/PageHeader";
import StripeCheckoutForm from "@/components/stripe/StripeCheckoutForm";
import { db } from "@/drizzle/db";
import { ProductTable } from "@/drizzle/schema";
import { getProductIdTag } from "@/features/products/db/cache";
import {
	userOwnsProduct,
	wherePublicProducts,
} from "@/features/products/db/product";
import { getCurrentUser } from "@/features/users/db/clerk";
import { ensureUserExists } from "@/features/users/db/users";
import { SignIn, SignUp } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProductPurchasePage({
	params,
	searchParams,
}: {
	params: Promise<{ productId: string }>;
	searchParams: Promise<{ authMode: string }>;
}) {
	return (
		<Suspense fallback={<PageLoader />}>
			<SuspendedComponent params={params} searchParams={searchParams} />
		</Suspense>
	);
}

async function SuspendedComponent({
	params,
	searchParams,
}: {
	params: Promise<{ productId: string }>;
	searchParams: Promise<{ authMode: string }>;
}) {
	const { productId } = await params;

	const product = await getPublicProduct(productId);

	if (!product) return notFound();

	const { clerkUserId, userId, user } = await getCurrentUser({ allData: true });

	// Handle race condition: If user is signed in to Clerk but not in DB yet,
	// ensure they exist before allowing checkout
	let dbUser = user;
	if (clerkUserId && !userId) {
		// console.log(
		// 	`[Purchase Page] User ${clerkUserId} signed in but not in DB, ensuring user exists`
		// );
		dbUser = await ensureUserExists(clerkUserId);
	}

	// console.log(dbUser);
	if (dbUser) {
		if (await userOwnsProduct({ userId: dbUser.id, productId: product.id })) {
			redirect("/courses");
		}

		return (
			<main className="containers my-6">
				<StripeCheckoutForm product={product} user={dbUser} />
			</main>
		);
	}

	const { authMode } = await searchParams;
	const isSignUp = authMode === "signUp"; // to change both singIn and signUp in same page
	// console.log(authMode);

	return (
		<main className="containers my-6 flex flex-col items-center">
			<PageHeader title="You need an account to make a purchase" />
			{isSignUp ? (
				<SignUp
					routing="hash" // will add hash # to not break the url (when clerk adds / in url for auth logic)
					signInUrl={`/product/${productId}/${product.slug}/purchase?authMode=signIn`} // switch between sign in and up
					forceRedirectUrl={`/product/${productId}/${product.slug}/purchase`}
				/>
			) : (
				<SignIn
					routing="hash"
					signUpUrl={`/product/${productId}/${product.slug}/purchase?authMode=signUp`}
					forceRedirectUrl={`/product/${productId}/${product.slug}/purchase`}
				/>
			)}
		</main>
	);
}

async function getPublicProduct(productId: string) {
	"use cache";
	cacheTag(getProductIdTag(productId));

	return db.query.ProductTable.findFirst({
		columns: {
			id: true,
			name: true,
			slug: true,
			description: true,
			imageUrl: true,
			priceInDollars: true,
		},
		where: and(eq(ProductTable.id, productId), wherePublicProducts),
	});
}
