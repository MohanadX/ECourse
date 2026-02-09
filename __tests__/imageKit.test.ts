// Mock ImageKit module - using jest.fn() directly in the factory
jest.mock("imagekit", () => {
	const mockUploadFn = jest.fn();
	return jest.fn().mockImplementation(() => ({
		upload: mockUploadFn,
	}));
});

// Mock Sharp - using jest.fn() directly in the factory
jest.mock("sharp", () => {
	const mockMetadataFn = jest.fn();
	return jest.fn(() => ({
		metadata: mockMetadataFn,
	}));
});

// Mock environment variables
jest.mock("@/data/env/server", () => ({
	env: {
		IMAGEKIT_PUBLIC_KEY: "test_public_key",
		IMAGEKIT_PRIVATE_KEY: "test_private_key",
		IMAGEKIT_URL_ENDPOINT: "https://test.imagekit.io",
	},
}));

// Import after mocks
import { uploadImage } from "@/features/imageKit";
import ImageKit from "imagekit";
import sharp from "sharp";

describe("uploadImage", () => {
	// Get references to the mock functions
	let mockUpload: jest.Mock;
	let mockMetadata: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();

		// Create a new instance to get the mocked methods
		const imageKitInstance = new (ImageKit as jest.MockedClass<
			typeof ImageKit
		>)();
		mockUpload = imageKitInstance.upload as jest.Mock;

		const sharpInstance = sharp(Buffer.from("test"));
		mockMetadata = sharpInstance.metadata as jest.Mock;
	});

	it("should return existing URL when image is a string", async () => {
		const existingUrl = "https://ik.imagekit.io/demo/existing-image.jpg";

		const result = await uploadImage(existingUrl);

		expect(result).toEqual({
			imageUrl: existingUrl,
			success: true,
		});

		// Should not call ImageKit
		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("should successfully upload a valid image file", async () => {
		// Create a mock File
		const mockFile = new File(["test"], "test-image.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		// Mock sharp metadata to return valid dimensions
		mockMetadata.mockResolvedValue({
			width: 1920,
			height: 1080,
		});

		// Mock ImageKit upload success
		mockUpload.mockResolvedValue({
			url: "https://ik.imagekit.io/demo/uploaded-image.jpg",
			fileId: "file_123",
		});

		const result = await uploadImage(mockFile);

		expect(result).toEqual({
			success: true,
			imageUrl: "https://ik.imagekit.io/demo/uploaded-image.jpg",
			imageFileId: "file_123",
		});

		expect(mockUpload).toHaveBeenCalledWith({
			file: expect.any(Buffer),
			fileName: "test-image jpg", // Dots replaced with spaces
			folder: "/ecourse/products",
		});
	});

	it("should reject image with width too small", async () => {
		const mockFile = new File(["test"], "small-image.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		// Mock sharp metadata to return small width
		mockMetadata.mockResolvedValue({
			width: 800, // Less than MIN_WIDTH (1200)
			height: 1080,
		});

		const result = await uploadImage(mockFile);

		expect(result).toEqual({
			success: false,
			message: "The image is too small. Minimum size is 1200×630px.",
		});

		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("should reject image with height too small", async () => {
		const mockFile = new File(["test"], "small-image.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		// Mock sharp metadata to return small height
		mockMetadata.mockResolvedValue({
			width: 1920,
			height: 400, // Less than MIN_HEIGHT (630)
		});

		const result = await uploadImage(mockFile);

		expect(result).toEqual({
			success: false,
			message: "The image is too small. Minimum size is 1200×630px.",
		});

		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("should reject image with both dimensions too small", async () => {
		const mockFile = new File(["test"], "tiny-image.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		// Mock sharp metadata to return small dimensions
		mockMetadata.mockResolvedValue({
			width: 800,
			height: 400,
		});

		const result = await uploadImage(mockFile);

		expect(result.success).toBe(false);
		expect(result.message).toContain("1200×630px");
	});

	it("should handle sharp metadata extraction error", async () => {
		const mockFile = new File(["test"], "corrupt-image.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		// Mock sharp to throw an error
		mockMetadata.mockRejectedValue(new Error("Invalid image format"));

		const result = await uploadImage(mockFile);

		expect(result).toEqual({
			success: false,
			message: "The provided URL does not point to an image",
		});
	});

	it("should handle ImageKit upload failure", async () => {
		const mockFile = new File(["test"], "test-image.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		mockMetadata.mockResolvedValue({
			width: 1920,
			height: 1080,
		});

		// Mock ImageKit upload to fail
		mockUpload.mockRejectedValue(new Error("Upload failed: Network error"));

		const result = await uploadImage(mockFile);

		expect(result).toEqual({
			success: false,
			message: "The provided URL does not point to an image",
		});
	});

	it("should sanitize file name by replacing dots with spaces", async () => {
		const mockFile = new File(["test"], "my.test.image.file.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		mockMetadata.mockResolvedValue({
			width: 1920,
			height: 1080,
		});

		mockUpload.mockResolvedValue({
			url: "https://ik.imagekit.io/demo/uploaded.jpg",
			fileId: "file_123",
		});

		await uploadImage(mockFile);

		expect(mockUpload).toHaveBeenCalledWith(
			expect.objectContaining({
				fileName: "my test image file jpg", // All dots replaced with spaces
			}),
		);
	});

	it("should accept image with exact minimum dimensions", async () => {
		const mockFile = new File(["test"], "exact-min.jpg", {
			type: "image/jpeg",
		});

		// Mock arrayBuffer for File
		mockFile.arrayBuffer = jest
			.fn()
			.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

		// Exactly at minimum dimensions
		mockMetadata.mockResolvedValue({
			width: 1200,
			height: 630,
		});

		mockUpload.mockResolvedValue({
			url: "https://ik.imagekit.io/demo/exact-min.jpg",
			fileId: "file_456",
		});

		const result = await uploadImage(mockFile);

		expect(result.success).toBe(true);
		expect(mockUpload).toHaveBeenCalled();
	});
});
