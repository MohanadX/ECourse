/**
 * @jest-environment node
 */
import {
	createProduct,
	deleteProduct,
	fetchEProductsPage,
	mutateProduct,
} from "./products";
import { getCurrentUser } from "../users/db/clerk";
import { uploadImage } from "../imageKit";
import { revalidateProductCache } from "../products/db/cache";
import { revalidatePath } from "next/cache";
import { client, db } from "@/drizzle/db";
import { eq, sql } from "drizzle-orm";
import { CourseTable, ProductTable, UserTable } from "@/drizzle/schema";


// Mock dependencies
jest.mock("../users/db/clerk", () => ({
	getCurrentUser: jest.fn(),
}));

jest.mock("../imageKit", () => ({
	uploadImage: jest.fn(),
	imageKit: {
		deleteFile: jest.fn(),
	},
}));

jest.mock("../products/db/cache", () => ({
	revalidateProductCache: jest.fn(),
	getProductIdTag: jest.fn(),
}));

jest.mock("@/data/env/client");

jest.mock("@/data/env/server");

jest.mock("next/cache", () => ({
	revalidatePath: jest.fn(),
	cacheTag: jest.fn(),
}));

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockUploadImage = uploadImage as jest.Mock;
const mockRevalidateProductCache = revalidateProductCache as jest.Mock;
const mockRevalidatePath = revalidatePath as jest.Mock;

describe("Product Server Actions", () => {
	let testUser: typeof UserTable.$inferSelect;
	let testAdmin: typeof UserTable.$inferSelect;
	let course: typeof CourseTable.$inferSelect;
	let product: typeof ProductTable.$inferSelect;

	beforeAll(async () => {
		testUser = (await db.query.UserTable.findFirst({
			where: (users, { eq }) => eq(users.email, "test@example.com"),
		}))!;

		testAdmin = (await db.query.UserTable.findFirst({
			where: (users, { eq }) => eq(users.email, "admin@example.com"),
		}))!;

		course = (await db.query.CourseTable.findFirst({
			where: (courses, { eq }) => eq(courses.name, "Test Course"),
		}))!;

		product = (await db.query.ProductTable.findFirst({
			where: (products, { eq }) => eq(products.name, "Test Product"),
		}))!;
	});

	beforeEach(async () => {
		await db.execute(sql`BEGIN`);
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await db.execute(sql`ROLLBACK`);
		await db.delete(ProductTable).where(eq(ProductTable.name, "New Product"));
		await db
			.delete(ProductTable)
			.where(eq(ProductTable.name, "Updated Product"));
	});

	afterAll(async () => {
		await client.end();
	});

	describe("createProduct", () => {
		const getValidProductData = () => ({
			name: "New Product",
			description: "Description",
			priceInDollars: 100,
			image: new File([""], "test.png", { type: "image/png" }),
			status: "private" as const,
			courseIds: [course.id],
		});

		it("should fail if user is not authorized (role uses)", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "user",
				userId: testUser.id,
			});
			mockUploadImage.mockResolvedValue({
				success: true,
				imageUrl: "http://image.url/test.png",
				imageFileId: "file-id-1",
			});

			const result = await createProduct(getValidProductData());

			expect(result.success).toBe(false);
			expect(result.message).toBe("You are not authorized to create a product");
			expect(console.error).toHaveBeenCalledWith(
				"You are not authorized to create a product",
			);
		});

		it("should fail if input data is invalid", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});

			const result = await createProduct({
				...getValidProductData(),
				name: "",
			});

			expect(result.success).toBe(false);
			expect(result.message).toBe(
				"Invalid Inputs, please check the requirements",
			);
		});

		it("should fail if image upload fails", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});
			mockUploadImage.mockResolvedValue({
				success: false,
				message: "Upload failed",
			});

			const result = await createProduct(getValidProductData());

			expect(result.success).toBe(false);
			expect(result.message).toBe("Upload failed");
		});

		it("should create product successfully if authorized and valid", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});
			mockUploadImage.mockResolvedValue({
				success: true,
				imageUrl: "http://image.url/test.png",
				imageFileId: "file-id-1",
			});

			const result = await createProduct(getValidProductData());

			expect(result.success).toBe(true);
			expect(result.message).toBe("Successfully created your product");
			expect(mockRevalidatePath).toHaveBeenCalledWith(
				`/admin/${testAdmin.id}/products`,
			);
			expect(mockRevalidateProductCache).toHaveBeenCalled();

			// Verify DB insertion
			const product = await db.query.ProductTable.findFirst({
				where: (products, { eq }) => eq(products.name, "New Product"),
			});
			expect(product).toBeDefined();
			expect(product?.userId).toBe(testAdmin.id);
		});
	});

	describe("mutateProduct", () => {
		const getValidUpdateData = () => ({
			name: "Updated Product",
			description: "Updated Description",
			priceInDollars: 200,
			image: new File([""], "test.png", { type: "image/png" }),
			courseIds: [course.id],
			status: "private" as const,
		});

		it("should fail if user is not authorized", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "user",
				userId: testUser.id,
			});

			const result = await mutateProduct(product.id, getValidUpdateData());

			expect(result.success).toBe(false);
			expect(result.message).toBe(
				"You are not authorized to update this product",
			);
		});

		it("should fail if user does not own the product", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});

			// Create a product owned by someone else
			const [product] = await db
				.insert(ProductTable)
				.values({
					name: "Other Product",
					slug: "other-product",
					description: "Desc",
					userId: testUser.id,
					imageUrl: "url",
					imageFileId: "fid",
					priceInDollars: 100,
					status: "private",
				})
				.returning();

			const result = await mutateProduct(product.id, getValidUpdateData());

			expect(result.success).toBe(false);
			expect(result.message).toBe(
				"You are not authorized to update this product",
			);
		});

		it("should update product successfully if owner", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});
			mockUploadImage.mockResolvedValue({
				success: true,
				imageUrl: "http://image.url/existing.png",
			});

			// Insert product owned by testAdmin
			const [product] = await db
				.insert(ProductTable)
				.values({
					name: "My Product",
					slug: "my-product",
					description: "Desc",
					userId: testAdmin.id,
					imageUrl: "url",
					imageFileId: "fid",
					priceInDollars: 100,
					status: "private",
				})
				.returning();

			const result = await mutateProduct(product.id, getValidUpdateData());

			expect(result.success).toBe(true);
			expect(result.message).toBe("Product Has been updated successfully");

			// Verify update
			const updated = await db.query.ProductTable.findFirst({
				where: (p, { eq }) => eq(p.id, product.id),
			});
			expect(updated?.name).toBe("Updated Product");
		});
	});

	describe("deleteProduct", () => {
		it("should fail if user is not authorized", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "user",
				userId: testUser.id,
			});

			const result = await deleteProduct("some-id");

			expect(result.success).toBe(false);
			expect(result.message).toBe(
				"You are not authorized to delete this product",
			);
		});

		it("should fail if user does not own the product", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});

			const [product] = await db
				.insert(ProductTable)
				.values({
					name: "Other Product",
					slug: "other-product",
					description: "Desc",
					userId: testUser.id,
					imageUrl: "url",
					imageFileId: "fid",
					priceInDollars: 100,
					status: "private",
				})
				.returning();

			const result = await deleteProduct(product.id);

			expect(result.success).toBe(false);
			expect(result.message).toBe(
				"You are not authorized to delete this product",
			);
		});

		it("should delete product successfully if owner", async () => {
			mockGetCurrentUser.mockResolvedValue({
				role: "admin",
				userId: testAdmin.id,
			});

			const [product] = await db
				.insert(ProductTable)
				.values({
					name: "My Product",
					slug: "my-product",
					description: "Desc",
					userId: testAdmin.id,
					imageUrl: "url",
					imageFileId: "fid",
					priceInDollars: 100,
					status: "private",
				})
				.returning();

			const result = await deleteProduct(product.id);

			console.log(result);
			expect(result.success).toBe(true);
			expect(result.message).toBe("Successfully deleted your product");

			const deleted = await db.query.ProductTable.findFirst({
				where: (p, { eq }) => eq(p.id, product.id),
			});
			expect(deleted).toBeUndefined();
		});
	});

	describe("fetchEProductsPage", () => {
		it("should return only public products paginated", async () => {
			// Insert sample products
			await seedProducts({ count: 10, userId: testAdmin.id });

			const result = await fetchEProductsPage({ pageParam: 0 });

			expect(result.products).toHaveLength(8);
			expect(result.nextSkip).toBeNull();
		});
	});
});

type SeedProductsOptions = {
	count: number;
	userId: string;
	status?: "public" | "private";
};

async function seedProducts({
	count,
	userId,
	status = "public",
}: SeedProductsOptions) {
	const products = Array.from({ length: count }, (_, i) => ({
		name: `Public Product ${i + 1}`,
		slug: `public-product-${i + 1}`,
		description: `Description for product ${i + 1}`,
		userId,
		imageUrl: `https://example.com/image-${i + 1}.jpg`,
		imageFileId: `file_${i + 1}`,
		priceInDollars: 10 + i,
		status,
	}));

	return db.insert(ProductTable).values(products).returning();
}
