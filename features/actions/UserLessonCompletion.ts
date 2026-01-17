"use server";

import { revalidatePath } from "next/cache";
import { updateLessonCompleteStatus } from "../lessons/db/userLessonProgress";
import { getCurrentUser } from "../users/db/clerk";

export async function mutateLessonCompleteStatus(
	lessonId: string,
	complete: boolean,
	courseId: string,
	courseSlug: string
) {
	try {
		const { userId } = await getCurrentUser();

		if (!userId) {
			return {
				success: false,
				message: "You are not authorized to update lesson complete status",
			};
		}

		await updateLessonCompleteStatus(lessonId, userId, complete);

		revalidatePath(`/courses/${courseId}/${courseSlug}/lessons/${lessonId}`);

		return {
			success: true,
			message: "Successfully updated lesson complete status",
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Failed to update lesson complete status",
		};
	}
}
