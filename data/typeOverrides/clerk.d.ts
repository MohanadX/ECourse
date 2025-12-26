import { userRolesType } from "@/drizzle/schema";

export {};

declare global {
	interface CustomJwtSessionClaims {
		dbId?: string;
		role?: userRolesType;
	}

	interface UserPublicMetadata {
		dbId?: string;
		role?: userRolesType;
	}
}
