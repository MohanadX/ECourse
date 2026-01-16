"use server";

import { lessonSchema } from "@/data/zodSchema/lesson";
import { userRolesType } from "@/drizzle/schema";
import z from "zod";
import { getCurrentUser } from "../users/db/clerk";
import {
	eliminateLesson,
	getNextOrderOfLesson,
	insertLesson,
	updateLesson,
	updateLessonOrders,
} from "../lessons/db/lessons";

export async function createLesson(unsafeData: z.infer<typeof lessonSchema>) {
	const { success, data } = lessonSchema.safeParse(unsafeData);

	const user = await getCurrentUser();

	if (!(await lessonsPermission(user.role))) {
		console.error("You are not authorized to create Lessons");
		return {
			success: false,
			message: "You are not authorized to create Lessons",
		};
	} else if (!success) {
		console.error("Invalid input values, please check your lesson details");
		return {
			success: false,
			message: "Invalid input values, please check your lesson details",
		};
	}

	const order = await getNextOrderOfLesson(data.sectionId);

	try {
		await insertLesson({ ...data, order }, user.userId!);
	} catch {
		return {
			success: false,
			message: "Error Occurred while creating your lesson",
		};
	}

	return {
		success: true,
		message: "Successfully created your lesson",
	};
}

export async function mutateLesson(
	lessonId: string,
	unsafeData: z.infer<typeof lessonSchema>
) {
	const { success, data } = lessonSchema.safeParse(unsafeData);
	const user = await getCurrentUser();

	if (!(await lessonsPermission(user.role))) {
		console.error("You are not authorized to update Lessons");
		return {
			success: false,
			message: "You are not authorized to update Lessons",
		};
	} else if (!success) {
		console.error("Invalid input values, please check your lesson details");
		return {
			success: false,
			message: "Invalid input values, please check your lesson details",
		};
	}

	try {
		await updateLesson(lessonId, data, user.userId!);
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Error Occurred while updating your lesson",
		};
	}

	return {
		success: true,
		message: "Successfully updated your lesson",
	};
}

export async function deleteLesson(lessonId: string) {
	const user = await getCurrentUser();
	if (!(await lessonsPermission(user.role))) {
		console.error("You are not authorized to delete Lessons");
		return {
			success: false,
			message: "You are not authorized to delete Lessons",
		};
	}

	try {
		await eliminateLesson(lessonId, user.userId!);
	} catch {
		return {
			success: false,
			message: "Error Occurred while deleting your lesson",
		};
	}

	return {
		success: true,
		message: "Successfully deleted your lesson",
	};
}

export async function mutateLessonOrders(lessonIds: string[]) {
	const user = await getCurrentUser();
	if (lessonIds.length === 0 || !lessonsPermission(user.role)) {
		return { success: false, message: "Error reordering your lessons" };
	}

	try {
		await updateLessonOrders(lessonIds, user.userId!);
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Failed to update lesson orders",
		};
	}
	return {
		success: true,
		message: "Successfully reordered your lessons",
	};
}

export async function lessonsPermission(role: userRolesType | undefined) {
	return role === "admin";
}
