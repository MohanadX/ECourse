import { revalidateTag } from "next/cache";

export function getCourseGlobalTag() {
	return "Courses";
}

export function getCourseIdTag(id: string) {
	return `course:${id}`;
}

export function revalidateCourseCache(id: string) {
	revalidateTag(getCourseGlobalTag(), "max");
	revalidateTag(getCourseIdTag(id), "max");
}

export function getUserAccessCourseGlobalTag() {
	return "usersAccess";
}
