import { productStatusEnum } from "@/drizzle/schema";
import z from "zod";
import { env } from "../env/client";

const imageFileSchema = z
	.instanceof(File, { error: "Image is required" })
	.refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
		error: "Invalid image type extension. Allowed: JPG, PNG, WEBP, AVIF",
	})
	.refine((file) => file.size <= MAX_FILE_SIZE, {
		error: "Image size must be less than 2mb",
	});

const imageUrlSchema = z
	.string()
	.url()
	.refine(
		(url) =>
			url.startsWith(`https://ik.imagekit.io/${env.NEXT_PUBLIC_IMAGEKIT_ID}`),
		{
			error: "Invalid image URL source",
		}
	);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
];

export const productSchema = z.object({
	name: z
		.string()
		.min(1, { error: "Name is required" })
		.max(100, { error: "Name is maximum 100 characters" }),
	description: z.string().min(1, { error: "Description is required" }),
	priceInDollars: z
		.number({ error: "If you want the course to be free leave 0 " })
		.int({ error: "Price cannot be decimal number" })
		.nonnegative({ error: "Price cannot be negative number" }),
	image: z.union([imageFileSchema, imageUrlSchema]),
	status: z.enum(productStatusEnum.enumValues),
	courseIds: z
		.array(z.string())
		.min(1, { error: "At least one course is required" }),
});
