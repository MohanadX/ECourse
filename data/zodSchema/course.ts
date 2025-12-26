import z from "zod";

export const courseSchema = z.object({
	name: z.string().min(1, "Name Is Required"),
	description: z.string().min(1, "Description Is Required"),
});
