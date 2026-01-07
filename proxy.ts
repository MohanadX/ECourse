import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { forbidden, notFound } from "next/navigation";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { env } from "./data/env/server";
import { setUserCountryHeaders } from "./lib/utils";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)", // all of it children with it
	"/sign-up(.*)",
	"/api(.*)",
	"/courses/:courseId/lessons/:lessonId",
	"/product(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const aj = arcjet({
	key: env.ARCJET_KEY,
	rules: [
		shield({ mode: "LIVE" }),
		detectBot({
			mode: "LIVE",
			allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"], // no one can use postman or curl to access APIs
		}),
		slidingWindow({
			mode: "LIVE",
			interval: "1m",
			max: 100, // max of 100 request for one window each 1 minute (rate limit)
		}),
	],
});

export default clerkMiddleware(async (auth, req) => {
	const decision = await aj.protect(
		env.TEST_IP ? { ...req, ip: env.TEST_IP, headers: req.headers } : req
	);
	// the headers of req cannot be spread properly so we need to specify them from request

	// console.log(decision.ip.country);

	if (decision.isDenied()) {
		return forbidden(); // if user break any rule of ours in arcjet he will be denied
	}

	if (isAdminRoute(req)) {
		const user = await auth.protect();
		if (user.sessionClaims.role !== "admin") return notFound();
	}

	if (!isPublicRoute(req)) {
		await auth.protect();
	}

	if (!decision.ip.isVpn() && !decision.ip.isProxy()) {
		// if user using VPN or proxy to change their ip (purchase discounts)

		const headers = new Headers(req.headers);
		setUserCountryHeaders(headers, decision.ip.country);

		return NextResponse.next({ request: { headers } });
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
