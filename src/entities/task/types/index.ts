export type {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  UpdateTaskInput,
} from "@/server/features/task/dto";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskOutput = {
  id: string;
  columnId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateTaskOutput = Omit<TaskOutput, "createdAt">;
