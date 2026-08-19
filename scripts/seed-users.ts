import { db } from "../drizzle/db";
import { UserTable } from "../drizzle/schema/User";

async function seed() {
	console.log("Starting to seed 500 users...");
	
	const users = [];
	for (let i = 1; i <= 500; i++) {
		users.push({
			clerkUserId: `k6_test_user_${i}_${Date.now()}`,
			email: `k6testuser${i}@example.com`,
			name: `K6 Test User ${i}`,
			role: "user" as const,
		});
	}

	// We can insert all 500 in one batch, PG parameter limit is 65535, 500 * 4 fields = 2000 parameters
	try {
		await db.insert(UserTable).values(users);
		console.log("Successfully seeded 500 users.");
	} catch (error) {
		console.error("Error inserting users:", error);
	}
	
	process.exit(0);
}

seed().catch((err) => {
	console.error("Unexpected error:", err);
	process.exit(1);
});
