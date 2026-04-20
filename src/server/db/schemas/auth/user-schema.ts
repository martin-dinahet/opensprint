import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable(
	"user",
	{
		// ID
		id: text("id") //
			.primaryKey(),
		// NAME
		name: text("name") //
			.notNull(),
		// EMAIL
		email: text("email") //
			.notNull()
			.unique(),
		// EMAIL_VERIFIED
		emailVerified: boolean("email_verified") //
			.default(false)
			.notNull(),
		// IMAGE
		image: text("image"), //
		// CREATED_AT
		createdAt: timestamp("created_at") //
			.defaultNow()
			.notNull(),
		// UPDATED_AT
		updatedAt: timestamp("updated_at") //
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("user_identifier_idx").on(table.email)],
);
