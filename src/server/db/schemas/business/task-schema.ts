import { boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { column } from "./column-schema";
import { member } from "./member-schema";
import { organization } from "./project-schema";

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

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;
export type TaskUpdate = Partial<Omit<NewTask, "createdAt" | "id" | "updatedAt">>;

export const taskItem = pgTable(
  "task_item",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").default(false).notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("task_item_task_id_idx").on(table.taskId)],
);

export const projectTaskTag = pgTable(
  "project_task_tag",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("project_task_tag_project_id_idx").on(table.projectId)],
);

export const taskTag = pgTable(
  "task_tag",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => projectTaskTag.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.tagId] }), index("task_tag_tag_id_idx").on(table.tagId)],
);

export type TaskItem = typeof taskItem.$inferSelect;
export type NewTaskItem = typeof taskItem.$inferInsert;
export type TaskItemUpdate = Partial<Omit<NewTaskItem, "createdAt" | "id" | "taskId" | "updatedAt">>;
export type ProjectTaskTag = typeof projectTaskTag.$inferSelect;
export type NewProjectTaskTag = typeof projectTaskTag.$inferInsert;
export type ProjectTaskTagUpdate = Partial<Omit<NewProjectTaskTag, "createdAt" | "id" | "projectId" | "updatedAt">>;
