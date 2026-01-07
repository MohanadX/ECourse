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
	unsafeData: z.infer<typeof sectionSchema>
) {
	const { success, data } = sectionSchema.safeParse(unsafeData);

	if (!(await SectionPermission((await getCurrentUser()).role))) {
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

	revalidatePath(`/admin/courses/${section.courseId}/edit`);
	revalidateCourseSectionsCache(section.courseId, section.id);

	return {
		success: true,
		message: "Section Has been created successfully",
	};
}

export async function mutateSection(
	sectionId: string,
	unsafeData: z.infer<typeof sectionSchema>
) {
	const { success, data } = sectionSchema.safeParse(unsafeData);

	if (!(await SectionPermission((await getCurrentUser()).role))) {
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

	const updatedSection = await updateSection(sectionId, data);

	revalidatePath(`/admin/courses/${updatedSection.courseId}/edit`);
	revalidateCourseSectionsCache(updatedSection.courseId, updatedSection.id);

	return {
		success: true,
		message: "Course Has been updated successfully",
	};
}

export async function deleteSection(sectionId: string) {
	if (!SectionPermission((await getCurrentUser()).role)) {
		return {
			success: false,
			message: "You are not authorized to delete this section",
		};
	}

	const deletedSection = await eliminateSection(sectionId);

	if (!deletedSection) {
		return { success: false, message: `Failed to delete your section` };
	}

	revalidatePath(`/admin/courses/${deletedSection.courseId}/edit`);
	revalidateCourseSectionsCache(deletedSection.courseId, deletedSection.id);
	return {
		success: true,
		message: `Successfully Deleted your section ${deletedSection.name}`,
	};
}

export async function mutateSectionOrders(sectionIds: string[]) {
	if (
		sectionIds.length === 0 ||
		!SectionPermission((await getCurrentUser()).role)
	) {
		return { success: false, message: "Error reordering your sections" };
	}

	try {
		await updateSectionOrders(sectionIds);
	} catch {
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
