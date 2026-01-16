import { env } from "@/data/env/server";
import { syncClerkUserMetadata } from "@/features/users/db/clerk";
import {
	deleteUsers,
	insertUsers,
	updateUsers,
} from "@/features/users/db/users";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
	const headerPayload = await headers();
	const svixId = headerPayload.get("svix-id");
	const svixTimestamp = headerPayload.get("svix-timestamp");
	const svixSignature = headerPayload.get("svix-signature");

	if (!svixId || !svixTimestamp || !svixSignature) {
		return new Response("Error occurred -- no svix headers", {
			status: 400,
		});
	}

	const payload = await req.json();
	const body = JSON.stringify(payload);

	const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
	let event: WebhookEvent;

	try {
		event = wh.verify(body, {
			"svix-id": svixId,
			"svix-timestamp": svixTimestamp,
			"svix-signature": svixSignature,
		}) as WebhookEvent;
	} catch (err) {
		console.error("Error verifying webhook:", err);
		return new Response("Error occurred", {
			status: 400,
		});
	}

	switch (event.type) {
		case "user.created":
		case "user.updated": {
			const email = event.data.email_addresses.find(
				(email) => email.id === event.data.primary_email_address_id
			)?.email_address;
			const name = `${event.data.first_name} ${event.data.last_name}`.trim();

			if (!email) return new Response("No Email", { status: 400 });
			if (!name) return new Response("No Name", { status: 400 });
			if (event.type === "user.created") {
				const user = await insertUsers({
					clerkUserId: event.data.id,
					email,
					name,
					imageUrl: event.data.image_url,
					role: "admin",
				});
				await syncClerkUserMetadata(user);
			} else {
				await updateUsers(
					{ clerkUserId: event.data.id },
					{
						email,
						name,
						imageUrl: event.data.image_url,
						role: event.data.public_metadata.role, // we added role in override types file
					}
				);
			}
			break;
		}
		case "user.deleted": {
			if (event.data.id != null) {
				await deleteUsers({ clerkUserId: event.data.id });
			}
			break;
		}
	}

	return new Response("", { status: 200 });
}
