import { revalidateTag } from "next/cache";

export function getCourseSectionGlobalTag() {
	return `sections`;
}

export function getCourseSectionsTag(courseId: string) {
	return `sections:${courseId}`;
}

export function getCourseSectionIdTag(courseId: string, sectionId: string) {
	return `${sectionId}:${courseId}`;
}

export function revalidateCourseSectionsCache(
	courseId: string,
	sectionId: string
) {
	revalidateTag(getCourseSectionGlobalTag(), "max");
	revalidateTag(getCourseSectionsTag(courseId), "max");
	revalidateTag(getCourseSectionIdTag(courseId, sectionId), "max");
}
