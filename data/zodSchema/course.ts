import z from "zod";

export const courseSchema = z.object({
	name: z
		.string()
		.min(1, "Name Is Required")
		.max(100, { error: "Name is maximum 100 characters" }),
	description: z.string().min(1, "Description Is Required"),
});
