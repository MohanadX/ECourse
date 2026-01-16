import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateUserCache } from "./cache";
import { clerkClient } from "@clerk/nextjs/server";
import { syncClerkUserMetadata } from "./clerk";

export async function insertUsers(data: typeof UserTable.$inferInsert) {
	const [newUser] = await db
		.insert(UserTable)
		.values(data)
		.returning()
		.onConflictDoUpdate({
			target: [UserTable.clerkUserId], // if we have already the user we update their data
			set: data,
		});

	if (!newUser) {
		throw new Error("Failed Creating The User");
	}

	revalidateUserCache(newUser.id);

	return newUser;
}

export async function updateUsers(
	{ clerkUserId }: { clerkUserId: string },
	data: Partial<typeof UserTable.$inferInsert>
) {
	const [updatedUser] = await db
		.update(UserTable)
		.set(data)
		.where(eq(UserTable.clerkUserId, clerkUserId))
		.returning();

	if (!updatedUser) {
		throw new Error("Failed Updating The User");
	}

	revalidateUserCache(updatedUser.id);
	return updatedUser;
}

export async function deleteUsers({ clerkUserId }: { clerkUserId: string }) {
	const [deletedUser] = await db
		.update(UserTable)
		.set({
			deletedAt: new Date(),
			email: "redacted@deleted.com",
			name: "Deleted User",
			clerkUserId: "Deleted",
			imageUrl: null,
		})
		.where(eq(UserTable.clerkUserId, clerkUserId))
		.returning();

	if (!deletedUser) {
		throw new Error("Failed Deleting The User");
	}

	revalidateUserCache(deletedUser.id);
	return deletedUser;
}

/**
 * Ensures a user exists in the database by clerkUserId.
 * If the user doesn't exist, fetches their data from Clerk and creates them.
 * This prevents race conditions between Clerk webhooks and purchase flow.
 *
 * @param clerkUserId - The Clerk user ID
 * @returns The user from the database
 */
export async function ensureUserExists(clerkUserId: string) {
	// First check if user already exists in DB
	const existingUser = await db.query.UserTable.findFirst({
		where: eq(UserTable.clerkUserId, clerkUserId),
	});

	if (existingUser) {
		return existingUser;
	}

	// User doesn't exist - fetch from Clerk and create
	// console.log(
	// 	`[Fallback User Creation] User ${clerkUserId} not found in DB, creating via fallback`
	// );

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkUserId);

	const email = clerkUser.emailAddresses.find(
		(e) => e.id === clerkUser.primaryEmailAddressId
	)?.emailAddress;

	const name = `${clerkUser.firstName ?? ""} ${
		clerkUser.lastName ?? ""
	}`.trim();

	if (!email) {
		throw new Error("Missing email from Clerk user");
	}

	if (!name) {
		throw new Error("Missing name from Clerk user");
	}

	// insertUsers already handles conflicts with onConflictDoUpdate
	const user = await insertUsers({
		clerkUserId: clerkUser.id,
		email,
		name,
		imageUrl: clerkUser.imageUrl,
		role: "user",
	});

	// Sync metadata back to Clerk
	await syncClerkUserMetadata(user);

	// console.log(`[Fallback User Creation] Successfully created user ${user.id}`);

	return user;
}
