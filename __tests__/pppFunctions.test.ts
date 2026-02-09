import { getUserCoupon } from "@/lib/pppFunctions";
import { headers } from "next/headers";

// Mock Next.js headers
jest.mock("next/headers", () => ({
	headers: jest.fn(),
}));

// Mock the countryToCouponMap to avoid dependency on env variables
jest.mock("@/data/pppCoupons", () => ({
	countryToCouponMap: new Map([
		["IN", { stripeCouponId: "50_DISCOUNT", discountPercentage: 0.5 }],
		["BR", { stripeCouponId: "40_DISCOUNT", discountPercentage: 0.4 }],
		["IT", { stripeCouponId: "30_DISCOUNT", discountPercentage: 0.3 }],
		["DE", { stripeCouponId: "20_DISCOUNT", discountPercentage: 0.2 }],
	]),
}));

describe("getUserCoupon", () => {
	const mockHeaders = headers as jest.MockedFunction<typeof headers>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return coupon for user from 50% discount country", async () => {
		// Mock headers to return India (IN)
		mockHeaders.mockResolvedValue({
			get: jest.fn().mockReturnValue("IN"),
		} as unknown as Headers);

		const result = await getUserCoupon();

		expect(result).toEqual({
			stripeCouponId: "50_DISCOUNT",
			discountPercentage: 0.5,
		});
	});

	it("should return coupon for user from 40% discount country", async () => {
		// Mock headers to return Brazil (BR)
		mockHeaders.mockResolvedValue({
			get: jest.fn().mockReturnValue("BR"),
		} as unknown as Headers);

		const result = await getUserCoupon();

		expect(result).toEqual({
			stripeCouponId: "40_DISCOUNT",
			discountPercentage: 0.4,
		});
	});

	it("should return undefined when user has no country (VPN/proxy)", async () => {
		// Mock headers to return null (no country detected)
		mockHeaders.mockResolvedValue({
			get: jest.fn().mockReturnValue(null),
		} as unknown as Headers);

		const result = await getUserCoupon();

		expect(result).toBeUndefined();
	});

	it("should return undefined for user from non-eligible country", async () => {
		// Mock headers to return US (not in discount map)
		mockHeaders.mockResolvedValue({
			get: jest.fn().mockReturnValue("US"),
		} as unknown as Headers);

		const result = await getUserCoupon();

		expect(result).toBeUndefined();
	});

	it("should return undefined for invalid country code", async () => {
		// Mock headers to return invalid country code
		mockHeaders.mockResolvedValue({
			get: jest.fn().mockReturnValue("INVALID"),
		} as unknown as Headers);

		const result = await getUserCoupon();

		expect(result).toBeUndefined();
	});

	it("should call headers with correct header key", async () => {
		const mockGet = jest.fn().mockReturnValue("IN");
		mockHeaders.mockResolvedValue({
			get: mockGet,
		} as unknown as Headers);

		await getUserCoupon();

		expect(mockGet).toHaveBeenCalledWith("x-user-country");
	});

	it("should return correct structure with stripeCouponId and discountPercentage", async () => {
		mockHeaders.mockResolvedValue({
			get: jest.fn().mockReturnValue("DE"),
		} as unknown as Headers);

		const result = await getUserCoupon();

		expect(result).toHaveProperty("stripeCouponId");
		expect(result).toHaveProperty("discountPercentage");
		expect(typeof result?.stripeCouponId).toBe("string");
		expect(typeof result?.discountPercentage).toBe("number");
	});
});
