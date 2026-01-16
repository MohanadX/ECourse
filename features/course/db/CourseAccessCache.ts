import { revalidateTag } from "next/cache";

export function getUserCourseAccessGlobalTag() {
	return "userCourseAccess";
}

export function getUserCourseIdTag({
	courseId,
	userId,
}: {
	courseId: string;
	userId: string;
}) {
	return `user:${userId}:courseAccess:${courseId}`;
}

export function getUserCourseAccessUserTag(userId: string) {
	return `userAccess:${userId}`;
}

export function getAdminCourseAccessTag(userId: string) {
	return `admin:${userId}:courseAccess`;
}

export function revalidateUserCourseAccessCache({
	courseId,
	userId,
}: {
	courseId: string;
	userId: string;
}) {
	revalidateTag(getAdminCourseAccessTag(userId), "max");
	revalidateTag(getUserCourseAccessGlobalTag(), "max");
	revalidateTag(getUserCourseIdTag({ courseId, userId }), "max");
	revalidateTag(getUserCourseAccessUserTag(userId), "max");
}
