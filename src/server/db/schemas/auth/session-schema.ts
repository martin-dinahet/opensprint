import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user-schema";

export const session = pgTable(
	"session",
	{
		// ID
		id: text("id") //
			.primaryKey(),
		// EXPIRES_AT
		expiresAt:
			timestamp("expires_at") //
				.notNull(),
		// TOKEN
		token: text("token") //
			.notNull()
			.unique(),
		// CREATED_AT
		createdAt: timestamp("created_at") //
			.defaultNow()
			.notNull(),
		// UPDATED_AT
		updatedAt: timestamp("updated_at") //
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		// IP_ADDRESS
		ipAddress: text("ip_address"), //
		// USER_AGENT
		userAgent: text("user_agent"), //
		// USER_ID
		userId: text("user_id") //
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);
