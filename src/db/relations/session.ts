import { relations } from "drizzle-orm";
import { session } from "../schemas/session";
import { user } from "../schemas/user";

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
