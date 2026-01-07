"use server";

import { courseSchema } from "@/data/zodSchema/course";
import z from "zod";
import { getCurrentUser } from "../users/db/clerk";
import { userRolesType } from "@/drizzle/schema";
import {
	eliminateCourse,
	insertCourse,
	updateCourse,
} from "../course/db/course";
import { revalidatePath } from "next/cache";
import { revalidateCourseCache } from "../course/db/cache";

export async function createCourse(unsafeData: z.infer<typeof courseSchema>) {
	const { success, data } = courseSchema.safeParse(unsafeData);

	if (!(await canCreateCourse((await getCurrentUser()).role))) {
		console.error("You are not authorized to create Course");
		return {
			success: false,
			message: "You are not authorized to create Course",
		};
	} else if (!success) {
		console.error("Invalid inputs");
		return {
			success: false,
			message: "Invalid Inputs, please check the requirements",
		};
	}

	const course = await insertCourse(data);
	revalidateCourseCache(course.id);
	return {
		success: true,
		message: "Course Has been created successfully",
		courseId: course.id,
	};
}

export async function canCreateCourse(role: userRolesType | undefined) {
	return role === "admin";
}

export async function canDeleteCourse({
	role,
}: {
	role: userRolesType | undefined;
}) {
	return role === "admin";
}

export async function canUpdateCourse({
	role,
}: {
	role: userRolesType | undefined;
}) {
	return role === "admin";
}

export const wait = async (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export async function deleteCourse(courseId: string) {
	if (!canDeleteCourse(await getCurrentUser())) {
		return {
			success: false,
			message: "You are not authorized to delete this course",
		};
	}

	try {
		await eliminateCourse(courseId);
		revalidatePath(`/admin/courses/`);
		revalidateCourseCache(courseId);
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Error Occurred while deleting your course",
		};
	}
	return { success: true, message: "Successfully Deleted your course" };
}

export async function mutateCourse(
	id: string,
	unsafeData: Omit<z.infer<typeof courseSchema>, "slug">
) {
	const { success, data } = courseSchema.safeParse(unsafeData);

	if (!(await canUpdateCourse(await getCurrentUser()))) {
		console.error("You are not authorized to update this Course");
		return {
			success: false,
			message: "You are not authorized to update this Course",
		};
	} else if (!success) {
		// const errors = z.flattenError(error);
		return {
			success: false,
			message: "Error Occurred while updating your course",
		};
	}

	const course = await updateCourse(id, data);

	revalidatePath(`/admin/courses/${course.id}/edit`);
	revalidateCourseCache(course.id);

	return {
		success: true,
		message: "Course Has been updated successfully",
		courseId: course.id,
	};
}
