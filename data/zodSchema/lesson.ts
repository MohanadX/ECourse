import { lessonStatusEnum } from "@/drizzle/schema";
import z from "zod";

export const lessonSchema = z.object({
	name: z.string().min(1, { error: "Name is required" }),
	description: z
		.string()
		.transform((v) => (v === null ? "" : v))
		.nullable(),
	sectionId: z.string().min(1, { error: "Section is required" }),
	status: z.enum(lessonStatusEnum.enumValues, {
		error: "Invalid lesson status",
	}),
	youtubeVideoId: z.string().min(1, { error: "Youtube video is required" }),
});
