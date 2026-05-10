import type { ReactNode } from "react";
import type { ColumnOutput } from "@/entities/column";
import type { TaskCard as EntityTaskCard, TaskOutput } from "@/entities/task";

export type RootProps = {
  children: ReactNode;
};

export type ColumnsProps = {
  children: ReactNode;
};

export type ColumnProps = {
  column: ColumnOutput;
  isHovered: boolean;
  tasks: TaskOutput[];
};

export type TaskCardProps = {
  columnId: string;
  task: TaskOutput;
};

export type ConfirmableTaskCardProps = {
  members: Parameters<typeof EntityTaskCard>[0]["members"];
  onDelete: () => void;
  onEdit: (task: TaskOutput) => void;
  onView: (task: TaskOutput) => void;
  task: TaskOutput;
};

export type KanbanBoardProps = ColumnProps & {
  members?: Parameters<typeof EntityTaskCard>[0]["members"];
  onAddTask: () => void;
  onDeleteColumn: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: TaskOutput) => void;
  onViewTask: (task: TaskOutput) => void;
};
