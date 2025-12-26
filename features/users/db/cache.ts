import { revalidateTag } from "next/cache";

export function getUsersGlobalTag() {
	return "Users";
}

export function getUserIdTag(id: string) {
	return `user:${id}`;
}

export function revalidateUserCache(id: string) {
	revalidateTag(getUsersGlobalTag(), "max");
	revalidateTag(getUserIdTag(id), "max"); // max profile: use stale data while refetching new data for new requests
}
