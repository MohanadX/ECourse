import { courseSectionStatues } from "@/drizzle/schema";
import z from "zod";

export const sectionSchema = z.object({
	name: z.string().min(1, { error: "Name Is Required" }),
	status: z.enum(courseSectionStatues, {
		error: "Section status must be private or public only",
	}),
});
