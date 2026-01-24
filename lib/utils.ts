import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});
/**
 *
Server → client serialization converts Date → string
API routes return JSON → dates become strings
React Query caches plain JSON, not class instances
so if date was string convert to a date
 */
export function formatDate(date: Date | string) {
	return DATE_FORMATTER.format(
		typeof date === "string" ? new Date(date) : date,
	);
}

const PURCHASE_REFUND_WINDOW_MS = 24 * 60 * 60 * 1000; // one day

export function expireRefundPurchaseDate(purchaseDate: Date) {
	// console.log(purchaseDate);

	const now = Date.now();
	const isExpired = !(purchaseDate.getTime() + PURCHASE_REFUND_WINDOW_MS > now);

	let howMuchTimeLeft: number = 0;
	if (!isExpired) {
		howMuchTimeLeft = purchaseDate.getTime() + PURCHASE_REFUND_WINDOW_MS - now;
	}

	return {
		isExpired,
		howMuchTimeLeft,
	};
}

export function formatTimeDuration(ms: number) {
	if (ms <= 0) return "00:00:00";

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return [
		hours.toString().padStart(2, "0"),
		minutes.toString().padStart(2, "0"),
		seconds.toString().padStart(2, "0"),
	].join(":");
}

export function formatPrice(amount: number, { showZeroAsNumber = false } = {}) {
	const formatter = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
	});
	// undefined locale → uses the user’s system/browser locale
	// 2 if it’s a decimal (e.g. 10.5 → $10.50)

	if (amount === 0 && !showZeroAsNumber) return "Free";
	return formatter.format(amount);
}

export const generatePagination = (currentPage: number, totalPages: number) => {
	// Validate inputs
	if (totalPages < 1) return [];
	if (currentPage < 1) currentPage = 1;
	if (currentPage > totalPages) currentPage = totalPages;

	// If the total number of pages is 7 or less,
	// display all pages without any ellipsis.
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	// If the current page is among the first 3 pages,
	// show the first 3, an ellipsis, and the last 2 pages.
	if (currentPage <= 3) {
		return [1, 2, 3, "...", totalPages - 1, totalPages];
	}

	// If the current page is among the last 3 pages,
	// show the first 2, an ellipsis, and the last 3 pages.
	if (currentPage >= totalPages - 2) {
		return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
	}
	// [1,2,"...",8,9,10]

	// If the current page is somewhere in the middle,
	// show the first page, an ellipsis, the current page and its neighbors,
	// another ellipsis, and the last page.
	// [1,"...",4,5,6,"...",10]
	return [
		1,
		"...",
		currentPage - 1,
		currentPage,
		currentPage + 1,
		"...",
		totalPages,
	];
};

export function formatPlural(
	length: number,
	{
		singular,
		plural,
		includeCount = false,
	}: { singular: string; plural: string; includeCount?: boolean },
) {
	const word = length === 1 ? singular : plural;

	return includeCount ? `${length} ${word}` : word;
}
