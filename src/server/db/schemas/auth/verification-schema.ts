import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const verification = pgTable(
	"verification",
	{
		// ID
		id: text("id") //
			.primaryKey(),
		// IDENTIFIER
		identifier:
			text("identifier") //
				.notNull(),
		// VALUE
		value:
			text("value") //
				.notNull(),
		// EXPIRES_AT
		expiresAt:
			timestamp("expires_at") //
				.notNull(),
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
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);
