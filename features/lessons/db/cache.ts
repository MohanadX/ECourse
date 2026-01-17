import { revalidateTag } from "next/cache";

export function getLessonsGlobalTag() {
	return "lessons";
}

export function getAdminLessonsTag(userId: string) {
	return `admin:${userId}:lessons`;
}

export function getCourseLessonsTag(courseId: string) {
	return `lessons:${courseId}`;
}

export function getLessonIdTag(lessonId: string) {
	return `lesson:${lessonId}`;
}

export function revalidateLessonCache({
	lessonId,
	courseId,
	userId,
}: {
	lessonId: string;
	courseId: string;
	userId: string;
}) {
	revalidateTag(getLessonsGlobalTag(), "max");
	revalidateTag(getAdminLessonsTag(userId), "max");
	revalidateTag(getCourseLessonsTag(courseId), "max");
	revalidateTag(getLessonIdTag(lessonId), "max");
}
