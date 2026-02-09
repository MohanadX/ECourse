import {
	formatTimeDuration,
	generatePagination,
	expireRefundPurchaseDate,
} from "@/lib/utils";

describe("formatTimeDuration", () => {
	it("should return '00:00:00' for zero milliseconds", () => {
		expect(formatTimeDuration(0)).toBe("00:00:00");
	});

	it("should return '00:00:00' for negative milliseconds", () => {
		expect(formatTimeDuration(-1000)).toBe("00:00:00");
		expect(formatTimeDuration(-5000)).toBe("00:00:00");
	});

	it("should format seconds only (less than 1 minute)", () => {
		expect(formatTimeDuration(5000)).toBe("00:00:05"); // 5 seconds
		expect(formatTimeDuration(30000)).toBe("00:00:30"); // 30 seconds
		expect(formatTimeDuration(59000)).toBe("00:00:59"); // 59 seconds
	});

	it("should format minutes and seconds (less than 1 hour)", () => {
		expect(formatTimeDuration(60000)).toBe("00:01:00"); // 1 minute
		expect(formatTimeDuration(90000)).toBe("00:01:30"); // 1 min 30 sec
		expect(formatTimeDuration(3599000)).toBe("00:59:59"); // 59 min 59 sec
	});

	it("should format hours, minutes, and seconds", () => {
		expect(formatTimeDuration(3600000)).toBe("01:00:00"); // 1 hour
		expect(formatTimeDuration(3661000)).toBe("01:01:01"); // 1h 1m 1s
		expect(formatTimeDuration(7200000)).toBe("02:00:00"); // 2 hours
	});

	it("should handle large durations", () => {
		expect(formatTimeDuration(86400000)).toBe("24:00:00"); // 24 hours
		expect(formatTimeDuration(90061000)).toBe("25:01:01"); // 25h 1m 1s
	});

	it("should pad single digits with zeros", () => {
		expect(formatTimeDuration(3661000)).toBe("01:01:01");
		expect(formatTimeDuration(36000)).toBe("00:00:36");
	});

	it("should handle edge case at exactly 1 millisecond before next unit", () => {
		expect(formatTimeDuration(999)).toBe("00:00:00"); // Rounds down
		expect(formatTimeDuration(59999)).toBe("00:00:59"); // 59.999 seconds
	});
});

describe("generatePagination", () => {
	it("should return empty array for invalid total pages", () => {
		expect(generatePagination(1, 0)).toEqual([]);
		expect(generatePagination(1, -1)).toEqual([]);
	});

	it("should return all pages when total pages <= 7", () => {
		expect(generatePagination(1, 1)).toEqual([1]);
		expect(generatePagination(1, 3)).toEqual([1, 2, 3]);
		expect(generatePagination(3, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(generatePagination(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it("should handle current page in first 3 pages", () => {
		expect(generatePagination(1, 10)).toEqual([1, 2, 3, "...", 9, 10]);
		expect(generatePagination(2, 10)).toEqual([1, 2, 3, "...", 9, 10]);
		expect(generatePagination(3, 10)).toEqual([1, 2, 3, "...", 9, 10]);
	});

	it("should handle current page in last 3 pages", () => {
		expect(generatePagination(8, 10)).toEqual([1, 2, "...", 8, 9, 10]);
		expect(generatePagination(9, 10)).toEqual([1, 2, "...", 8, 9, 10]);
		expect(generatePagination(10, 10)).toEqual([1, 2, "...", 8, 9, 10]);
	});

	it("should handle current page in the middle", () => {
		expect(generatePagination(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
		expect(generatePagination(6, 15)).toEqual([1, "...", 5, 6, 7, "...", 15]);
	});

	it("should normalize current page if out of bounds", () => {
		// Current page < 1 should be treated as 1
		expect(generatePagination(0, 10)).toEqual([1, 2, 3, "...", 9, 10]);
		expect(generatePagination(-5, 10)).toEqual([1, 2, 3, "...", 9, 10]);

		// Current page > totalPages should be treated as totalPages
		expect(generatePagination(15, 10)).toEqual([1, 2, "...", 8, 9, 10]);
		expect(generatePagination(100, 10)).toEqual([1, 2, "...", 8, 9, 10]);
	});

	it("should handle edge case at page 4 (transition from first 3 to middle)", () => {
		expect(generatePagination(4, 10)).toEqual([1, "...", 3, 4, 5, "...", 10]);
	});

	it("should handle edge case at page totalPages - 3 (transition from middle to last 3)", () => {
		expect(generatePagination(7, 10)).toEqual([1, "...", 6, 7, 8, "...", 10]);
	});

	it("should work correctly with exactly 8 pages", () => {
		expect(generatePagination(1, 8)).toEqual([1, 2, 3, "...", 7, 8]);
		expect(generatePagination(4, 8)).toEqual([1, "...", 3, 4, 5, "...", 8]);
		expect(generatePagination(8, 8)).toEqual([1, 2, "...", 6, 7, 8]);
	});
});

describe("expireRefundPurchaseDate", () => {
	// Mock Date.now() to have consistent test results
	const MOCK_NOW = new Date("2024-01-15T12:00:00Z").getTime();
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;

	beforeEach(() => {
		jest.spyOn(Date, "now").mockReturnValue(MOCK_NOW);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should return not expired for purchase within 24 hours", () => {
		// Purchase 1 hour ago
		const purchaseDate = new Date(MOCK_NOW - 60 * 60 * 1000);
		const result = expireRefundPurchaseDate(purchaseDate);

		expect(result.isExpired).toBe(false);
		expect(result.howMuchTimeLeft).toBeGreaterThan(0);
		expect(result.howMuchTimeLeft).toBeLessThanOrEqual(ONE_DAY_MS);
	});

	it("should return correct time left for recent purchase", () => {
		// Purchase 1 hour ago
		const oneHourAgo = 60 * 60 * 1000;
		const purchaseDate = new Date(MOCK_NOW - oneHourAgo);
		const result = expireRefundPurchaseDate(purchaseDate);

		expect(result.isExpired).toBe(false);
		// Should have approximately 23 hours left
		expect(result.howMuchTimeLeft).toBeCloseTo(ONE_DAY_MS - oneHourAgo, -2);
	});

	it("should return not expired for purchase just under 24 hours ago", () => {
		// Purchase 23 hours 59 minutes ago
		const almostOneDayAgo = ONE_DAY_MS - 60 * 1000;
		const purchaseDate = new Date(MOCK_NOW - almostOneDayAgo);
		const result = expireRefundPurchaseDate(purchaseDate);

		expect(result.isExpired).toBe(false);
		expect(result.howMuchTimeLeft).toBeGreaterThan(0);
		expect(result.howMuchTimeLeft).toBeLessThanOrEqual(60 * 1000); // Less than 1 minute
	});

	it("should return expired for purchase exactly 24 hours ago", () => {
		const purchaseDate = new Date(MOCK_NOW - ONE_DAY_MS);
		const result = expireRefundPurchaseDate(purchaseDate);

		expect(result.isExpired).toBe(true);
		expect(result.howMuchTimeLeft).toBe(0);
	});

	it("should return expired for purchase more than 24 hours ago", () => {
		// Purchase 25 hours ago
		const purchaseDate = new Date(MOCK_NOW - ONE_DAY_MS - 60 * 60 * 1000);
		const result = expireRefundPurchaseDate(purchaseDate);

		expect(result.isExpired).toBe(true);
		expect(result.howMuchTimeLeft).toBe(0);
	});

	it("should return expired for very old purchase", () => {
		// Purchase 30 days ago
		const purchaseDate = new Date(MOCK_NOW - 30 * ONE_DAY_MS);
		const result = expireRefundPurchaseDate(purchaseDate);

		expect(result.isExpired).toBe(true);
		expect(result.howMuchTimeLeft).toBe(0);
	});
});
