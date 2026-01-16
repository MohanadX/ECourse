import { revalidateTag } from "next/cache";

export function getLessonProgressGlobalTag() {
	return `lessonsCompleted`;
}

export function getLessonProgressUserIdTag(lessonId: string, userId: string) {
	return `user:${userId}:lessonCompleted:${lessonId}`;
}

export function getLessonProgressUserTag(userId: string) {
	return `user:${userId}:lessonsCompleted`;
}

export function revalidateLessonProgressCache(
	lessonId: string,
	userId: string
) {
	revalidateTag(getLessonProgressGlobalTag(), "max");
	revalidateTag(getLessonProgressUserIdTag(lessonId, userId), "max");
	revalidateTag(getLessonProgressUserTag(userId), "max");
}
