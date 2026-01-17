import { db } from "@/drizzle/db";
import { UserLessonProgressTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { revalidateLessonProgressCache } from "./userLessonProgressCache";

export async function updateLessonCompleteStatus(
	lessonId: string,
	userId: string,
	complete: boolean
) {
	let completion: { lessonId: string; userId: string } | undefined;
	if (complete) {
		const [c] = await db
			.insert(UserLessonProgressTable)
			.values({
				lessonId,
				userId,
			})
			.onConflictDoNothing()
			.returning();
		completion = c;
	} else {
		const [c] = await db
			.delete(UserLessonProgressTable)
			.where(
				and(
					eq(UserLessonProgressTable.userId, userId),
					eq(UserLessonProgressTable.lessonId, lessonId)
				)
			)
			.returning();
		completion = c;
	}

	if (!completion) {
		throw new Error("Failed to update lesson complete status");
	}

	revalidateLessonProgressCache(lessonId, userId);
}
