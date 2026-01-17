import { revalidateTag } from "next/cache";

export function getUserCoursesTag(userId: string) {
	return `user:${userId}:courses`;
}

export function getCourseIdTag(id: string) {
	return `course:${id}`;
}

export function revalidateCourseCache(id: string, userId: string) {
	revalidateTag(getUserCoursesTag(userId), "max");
	revalidateTag(getCourseIdTag(id), "max");
}
