import { revalidateTag } from "next/cache";

export function getLessonsGlobalTag() {
	return "lessons";
}

export function getCourseLessonsTag(courseId: string) {
	return `lessons:${courseId}`;
}

export function getLessonIdTag(lessonId: string) {
	return `lesson:${lessonId}`;
}

export function revalidateLessonCache(lessonId: string, courseId: string) {
	revalidateTag(getLessonsGlobalTag(), "max");
	revalidateTag(getCourseLessonsTag(courseId), "max");
	revalidateTag(getLessonIdTag(lessonId), "max");
}
