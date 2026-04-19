import { relations } from "drizzle-orm";
import { account } from "../schemas/account";
import { user } from "../schemas/user";

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
