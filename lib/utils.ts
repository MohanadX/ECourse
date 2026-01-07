import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const COUNTRY_HEADER_KEY = "x-user-country";
export async function setUserCountryHeaders(
	headers: Headers,
	country: string | undefined
) {
	if (!country) {
		headers.delete(COUNTRY_HEADER_KEY);
	} else {
		headers.set(COUNTRY_HEADER_KEY, country);
	}
}
