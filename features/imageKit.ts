import { env } from "@/data/env/server";
import ImageKit from "imagekit";
import sharp from "sharp";

export const imageKit = new ImageKit({
	publicKey: env.IMAGEKIT_PUBLIC_KEY,
	privateKey: env.IMAGEKIT_PRIVATE_KEY,
	urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

export async function uploadImage(image: File) {
	try {
		const buffer = Buffer.from(await image.arrayBuffer());
		const imageMetadata = await sharp(buffer).metadata();

		// ---- Constraints ----
		const MIN_WIDTH = 1200;
		const MIN_HEIGHT = 630;

		if (imageMetadata.width < MIN_WIDTH || imageMetadata.height < MIN_HEIGHT) {
			// small images
			console.error("Image size is too small");
			return {
				success: false,
				message: `The image is too small. Minimum size is ${MIN_WIDTH}×${MIN_HEIGHT}px.`,
			};
		}

		const imageFromKit = await imageKit.upload({
			file: buffer,
			fileName: sanitizeFileName(image.name),
			folder: "/ecourse/products",
		});

		console.log(imageFromKit);

		return {
			success: true,
			imageUrl: imageFromKit.url,
			imageFileId: imageFromKit.fileId,
		};
	} catch (error) {
		console.error(`Error Occurred: ${error}`);
		return {
			success: false,
			message: "The provided URL does not point to an image",
		};
	}
}

type ImageKitError = {
	message: string;
	help: string;
};
/*
{ message: string; help: string }
*/

function sanitizeFileName(filename: string) {
	// regex to replace all dots in name
	const regex = /\.+/g;
	return filename.replaceAll(regex, " ");
}
