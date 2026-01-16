import { revalidateTag } from "next/cache";

export function getCourseSectionGlobalTag() {
	return `sections`;
}

export function getAdminCourseSectionsTag(userId: string) {
	return `admin:${userId}:sections`;
}

export function getCourseSectionsTag(courseId: string) {
	return `sections:${courseId}`;
}

export function getCourseSectionIdTag(courseId: string, sectionId: string) {
	return `${sectionId}:${courseId}`;
}

export function revalidateCourseSectionsCache(
	userId: string,
	courseId: string,
	sectionId: string
) {
	revalidateTag(getAdminCourseSectionsTag(userId), "max");
	revalidateTag(getCourseSectionGlobalTag(), "max");
	revalidateTag(getCourseSectionsTag(courseId), "max");
	revalidateTag(getCourseSectionIdTag(courseId, sectionId), "max");
}
