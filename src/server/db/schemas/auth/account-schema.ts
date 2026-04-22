import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user-schema";

export const account = pgTable(
  "account",
  {
    // ID
    id: text("id") //
      .primaryKey(),
    // ACCOUNT_ID
    accountId:
      text("account_id") //
        .notNull(),
    // PROVIDER_ID
    providerId:
      text("provider_id") //
        .notNull(),
    // USER_ID
    userId: text("user_id") //
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // ACCESS_TOKEN
    accessToken: text("access_token"), //
    // REFRESH_TOKEN
    refreshToken: text("refresh_token"), //
    // ID_TOKEN
    idToken: text("id_token"), //
    // ACCESS_TOKEN_EXPIRES_AT
    accessTokenExpiresAt: timestamp("access_token_expires_at"), //
    // REFRESH_TOKEN_EXPIRES_AT
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), //
    // SCOPE
    scope: text("scope"), //
    // PASSWORD
    password: text("password"), //
    // CREATED_AT
    createdAt: timestamp("created_at") //
      .defaultNow()
      .notNull(),
    // UPDATED_AT
    updatedAt: timestamp("updated_at") //
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);
