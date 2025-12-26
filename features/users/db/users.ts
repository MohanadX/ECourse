import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateUserCache } from "./cache";

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
		throw new Error("Failed Updating The User");
	}

	revalidateUserCache(deletedUser.id);
	return deletedUser;
}
