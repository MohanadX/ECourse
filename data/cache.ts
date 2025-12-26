export type Cache_Tag = "products" | "users" | "courses";

export function getGlobalTag(tag: string) {
	return `global:${tag}`;
}
