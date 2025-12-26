import { userRolesType, UserTable } from "@/drizzle/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cacheTag } from "next/cache";
import { getUserIdTag } from "./cache";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";

const client = await clerkClient();

export async function getCurrentUser({ allData = false } = {}) {
	const { userId, sessionClaims, redirectToSignIn } = await auth();

	return {
		clerkUserId: userId,
		userId: sessionClaims?.dbId,
		role: sessionClaims?.role,
		user:
			allData && sessionClaims?.dbId != null
				? await getUser(sessionClaims.dbId)
				: undefined,
		redirectToSignIn,
	};
}

export function syncClerkUserMetadata(user: {
	id: string;
	clerkUserId: string;
	role: userRolesType;
}) {
	return client.users.updateUserMetadata(user.clerkUserId, {
		publicMetadata: {
			dbId: user.id,
			role: user.role,
		},
	});
}

export async function getUser(id: string) {
	"use cache";
	cacheTag(getUserIdTag(id));
	console.log("Called");

	return db.query.UserTable.findFirst({
		where: eq(UserTable.id, id),
	});
}
