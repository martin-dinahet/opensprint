import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { column } from "./column-schema";
import { member } from "./member-schema";

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const task = pgTable(
  "task",
  {
    // ID
    id: text("id") //
      .primaryKey(),
    // COLUMN_ID
    columnId: text("column_id") //
      .notNull()
      .references(() => column.id),
    // ASSIGNEE_ID
    assigneeId: text("assignee_id") //
      .references(() => member.id),
    // TITLE
    title:
      text("title") //
        .notNull(),
    // DESCRIPTION
    description: text("description"),
    // PRIORITY
    priority:
      taskPriorityEnum("priority") //
        .notNull(),
    // POSITION
    position:
      integer("position") //
        .notNull(),
    // DUE_DATE
    dueDate: timestamp("due_date"),
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
  (table) => [index("task_column_id_idx").on(table.columnId), index("task_assignee_id_idx").on(table.assigneeId)],
);
