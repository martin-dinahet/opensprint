import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { board } from "./board";
import { projectMember } from "./project-member";
import { user } from "./user";

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const task = pgTable(
  "task",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => projectMember.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriorityEnum("priority"),
    position: integer("position").notNull(),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_boardId_idx").on(table.boardId),
    index("task_assigneeId_idx").on(table.assigneeId),
    index("task_userId_idx").on(table.userId),
  ],
);

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;
export type UpdateTask = Partial<
  Pick<NewTask, "title" | "description" | "priority" | "position" | "dueDate" | "assigneeId" | "boardId">
>;
