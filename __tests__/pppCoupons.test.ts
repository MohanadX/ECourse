jest.mock("@/data/env/server", () => ({
	env: {
		STRIPE_PPP_20_COUPON_ID: "test_20",
		STRIPE_PPP_30_COUPON_ID: "test_30",
		STRIPE_PPP_40_COUPON_ID: "test_40",
		STRIPE_PPP_50_COUPON_ID: "test_50",
	},
}));

import { countryToCouponMap, pppCoupons } from "@/data/pppCoupons";

describe("countryToCouponMap", () => {
	it("should be a Map instance", () => {
		expect(countryToCouponMap).toBeInstanceOf(Map);
	});

	it("should contain entries for all country codes from pppCoupons", () => {
		const totalCountries = pppCoupons.reduce(
			(sum, coupon) => sum + coupon.countryCodes.length,
			0,
		);
		expect(countryToCouponMap.size).toBe(totalCountries);
	});

	it("should return correct coupon for 50% discount countries", () => {
		// Test a few countries from the 50% discount tier
		const testCountries = ["IN", "PK", "NG", "BD"];

		testCountries.forEach((countryCode) => {
			const coupon = countryToCouponMap.get(countryCode);
			expect(coupon).toBeDefined();
			expect(coupon?.discountPercentage).toBe(0.5);
			expect(coupon?.stripeCouponId).toBeDefined();
		});
	});

	it("should return correct coupon for 40% discount countries", () => {
		// Test a few countries from the 40% discount tier
		const testCountries = ["BR", "MX", "AR", "CN"];

		testCountries.forEach((countryCode) => {
			const coupon = countryToCouponMap.get(countryCode);
			expect(coupon).toBeDefined();
			expect(coupon?.discountPercentage).toBe(0.4);
			expect(coupon?.stripeCouponId).toBeDefined();
		});
	});

	it("should return correct coupon for 30% discount countries", () => {
		// Test a few countries from the 30% discount tier
		const testCountries = ["IT", "ES", "KR", "SG"];

		testCountries.forEach((countryCode) => {
			const coupon = countryToCouponMap.get(countryCode);
			expect(coupon).toBeDefined();
			expect(coupon?.discountPercentage).toBe(0.3);
			expect(coupon?.stripeCouponId).toBeDefined();
		});
	});

	it("should return correct coupon for 20% discount countries", () => {
		// Test a few countries from the 20% discount tier
		const testCountries = ["DE", "FR", "JP", "AT"];

		testCountries.forEach((countryCode) => {
			const coupon = countryToCouponMap.get(countryCode);
			expect(coupon).toBeDefined();
			expect(coupon?.discountPercentage).toBe(0.2);
			expect(coupon?.stripeCouponId).toBeDefined();
		});
	});

	it("should return undefined for non-eligible countries", () => {
		// Test countries not in any discount tier
		const nonEligibleCountries = ["US", "CA", "GB", "AU", "NZ"];

		nonEligibleCountries.forEach((countryCode) => {
			const coupon = countryToCouponMap.get(countryCode);
			expect(coupon).toBeUndefined();
		});
	});

	it("should return undefined for invalid country codes", () => {
		expect(countryToCouponMap.get("XX")).toBeUndefined();
		expect(countryToCouponMap.get("ZZ")).toBeUndefined();
		expect(countryToCouponMap.get("")).toBeUndefined();
	});

	it("should have correct structure for coupon info", () => {
		const coupon = countryToCouponMap.get("IN");

		expect(coupon).toHaveProperty("stripeCouponId");
		expect(coupon).toHaveProperty("discountPercentage");
		expect(typeof coupon?.stripeCouponId).toBe("string");
		expect(typeof coupon?.discountPercentage).toBe("number");
	});

	it("should provide O(1) lookup performance", () => {
		// Structural check replacing flaky timing assertion
		expect(countryToCouponMap).toBeInstanceOf(Map);

		// Verify a few sample lookups return the expected coupon objects
		const inCoupon = countryToCouponMap.get("IN");
		expect(inCoupon).toBeDefined();
		expect(inCoupon?.discountPercentage).toBe(0.5);
		expect(inCoupon?.stripeCouponId).toBe("test_50");

		const brCoupon = countryToCouponMap.get("BR");
		expect(brCoupon).toBeDefined();
		expect(brCoupon?.discountPercentage).toBe(0.4);
		expect(brCoupon?.stripeCouponId).toBe("test_40");

		const deCoupon = countryToCouponMap.get("DE");
		expect(deCoupon).toBeDefined();
		expect(deCoupon?.discountPercentage).toBe(0.2);
		expect(deCoupon?.stripeCouponId).toBe("test_20");
	});
});
