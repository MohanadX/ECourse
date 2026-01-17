ALTER TABLE "courses" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "adminId" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_adminId_users_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;