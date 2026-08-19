import { db } from "../drizzle/db";
import { UserTable } from "../drizzle/schema/User";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

async function seedLocal() {
  // Read the private key for signing
  const privateKeyPath = path.join(process.cwd(), "test_private.pem");
  if (!fs.existsSync(privateKeyPath)) {
    console.error(
      "test_private.pem not found in project root. Cannot sign JWTs.",
    );
    process.exit(1);
  }
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  const users = [];
  const k6Data = [];

  // Generate 500 users with deterministic IDs
  for (let i = 1; i <= 500; i++) {
    const clerkUserId = `k6_test_user_${i}`;
    const email = `k6testuser${i}@example.com`;

    users.push({
      clerkUserId,
      email,
      name: `K6 Test User ${i}`,
      role: "user" as const,
    });

    // Create standard Clerk claims
    // clerkMiddleware looks for 'sub' (userId) and sometimes 'sid' (session ID).
    const claims = {
      sub: clerkUserId,
      sid: `sess_k6_${i}`,
    };

    // Mint JWT valid for 30 days
    const token = jwt.sign(claims, privateKey, {
      algorithm: "RS256",
      expiresIn: "30d",
      // Sometimes clerk checks the authorized party
      header: {
        typ: "JWT",
        alg: "RS256",
      },
    });

    k6Data.push({
      userId: clerkUserId,
      email,
      token,
    });
  }

  // Insert users in batch
  try {
    await db.insert(UserTable).values(users);
    console.log("Successfully seeded 500 clean users.");
  } catch (error) {
    console.error("Error inserting users:", error);
    process.exit(1);
  }

  // Write the K6 data file
  const outPath = path.join(process.cwd(), "scripts", "k6-users.json");
  fs.writeFileSync(outPath, JSON.stringify(k6Data, null, 2));
  console.log(`Generated JWTs and saved to ${outPath}`);

  process.exit(0);
}

seedLocal().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
