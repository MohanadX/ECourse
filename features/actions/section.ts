"use server";

import z from "zod";
import { getCurrentUser } from "../users/db/clerk";
import { userRolesType } from "@/drizzle/schema";

import { sectionSchema } from "@/data/zodSchema/section";
import {
	eliminateSection,
	getNextOrderOfSection,
	insertSection,
	updateSection,
	updateSectionOrders,
} from "../sections/db/sections";
import { revalidatePath } from "next/cache";
import { revalidateCourseSectionsCache } from "../sections/db/cache";

export async function createSection(
	courseId: string,
	unsafeData: z.infer<typeof sectionSchema>,
) {
	const { success, data } = sectionSchema.safeParse(unsafeData);

	const user = await getCurrentUser();

	if (!(await SectionPermission(user.role))) {
		console.error("You are not authorized to create Section");
		return {
			success: false,
			message: "You are not authorized to create Section",
		};
	} else if (!success) {
		// const errors = z.flattenError(error);
		return {
			success: false,
			message: "Error Occurred while creating your section",
		};
	}

	const order = await getNextOrderOfSection(courseId);

	const section = await insertSection({ ...data, order, courseId });

	revalidatePath(`/admin/${user.userId}/courses/${section.courseId}/edit`);
	revalidateCourseSectionsCache(user.userId!, section.courseId, section.id);

	return {
		success: true,
		message: "Section Has been created successfully",
	};
}

export async function mutateSection(
	sectionId: string,
	unsafeData: z.infer<typeof sectionSchema>,
) {
	const { success, data } = sectionSchema.safeParse(unsafeData);
	const user = await getCurrentUser();

	if (!(await SectionPermission(user.role))) {
		console.error("You are not authorized to update this Section");
		return {
			success: false,
			message: "You are not authorized to update this Section",
		};
	} else if (!success) {
		console.error("Invalid Inputs");
		return {
			success: false,
			message: "Invalid Inputs, please check the requirements",
		};
	}

	const updatedSection = await updateSection(sectionId, data, user.userId!);

	revalidatePath(
		`/admin/${user.userId}/courses/${updatedSection.courseId}/edit`,
	);
	revalidateCourseSectionsCache(
		user.userId!,
		updatedSection.courseId,
		updatedSection.id,
	);

	return {
		success: true,
		message: "Course Has been updated successfully",
	};
}

export async function deleteSection(sectionId: string) {
	const user = await getCurrentUser();
	if (!SectionPermission(user.role)) {
		return {
			success: false,
			message: "You are not authorized to delete this section",
		};
	}

	const deletedSection = await eliminateSection(sectionId, user.userId!);

	if (!deletedSection) {
		return { success: false, message: `Failed to delete your section` };
	}

	revalidatePath(
		`/admin/${user.userId}/courses/${deletedSection.courseId}/edit`,
	);
	revalidateCourseSectionsCache(
		user.userId!,
		deletedSection.courseId,
		deletedSection.id,
	);
	return {
		success: true,
		message: `Successfully Deleted your section ${deletedSection.name}`,
	};
}

export async function mutateSectionOrders(sectionIds: string[]) {
	const user = await getCurrentUser();
	if (sectionIds.length === 0 || !SectionPermission(user.role)) {
		return { success: false, message: "Error reordering your sections" };
	}

	try {
		await updateSectionOrders(sectionIds, user.userId!);
	} catch (error) {
		console.error(error);
		return {
			success: false,
			message: "Failed to update section orders",
		};
	}
	return {
		success: true,
		message: "Successfully reordered your sections",
	};
}

export async function SectionPermission(role: userRolesType | undefined) {
	return role === "admin";
}
