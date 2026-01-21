import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});

export function formatDate(date: Date) {
	return DATE_FORMATTER.format(date);
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
