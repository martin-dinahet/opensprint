export type {
  AssignTaskInput,
  AttachTaskTagInput,
  CreateProjectTaskTagInput,
  CreateTaskInput,
  CreateTaskItemInput,
  MoveTaskInput,
  ReorderTaskInput,
  ReorderTaskItemsInput,
  TransferTaskInput,
  UpdateProjectTaskTagInput,
  UpdateTaskInput,
  UpdateTaskItemInput,
} from "@/server/use-cases/task/dto";

import type { ProjectTaskTag, Task, TaskItem } from "@/shared";

export type TaskPriority = Task["priority"];
export type TaskKind = Task["kind"];

export type TaskItemOutput = {
  id: TaskItem["id"];
  taskId: TaskItem["taskId"];
  title: TaskItem["title"];
  done: TaskItem["done"];
  position: TaskItem["position"];
  createdAt: string;
  updatedAt: string;
};

export type ProjectTaskTagOutput = {
  id: ProjectTaskTag["id"];
  projectId: ProjectTaskTag["projectId"];
  name: ProjectTaskTag["name"];
  color: ProjectTaskTag["color"];
  createdAt: string;
  updatedAt: string;
};

export type TaskOutput = {
  id: Task["id"];
  columnId: Task["columnId"];
  assigneeId: Exclude<Task["assigneeId"], undefined>;
  title: Task["title"];
  description: Exclude<Task["description"], undefined>;
  priority: TaskPriority;
  kind: TaskKind;
  estimate: Task["estimate"];
  position: Task["position"];
  dueDate: string | null;
  createdAt: string;
  items: TaskItemOutput[];
  tags: ProjectTaskTagOutput[];
  updatedAt: string;
};

export type UpdateTaskOutput = TaskOutput;
