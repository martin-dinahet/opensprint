import type { ReactNode } from "react";
import type { ColumnOutput } from "@/entities/column";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";

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

export type ColumnSettingsInput = {
  name: string;
  wipLimit: number | null;
};

export type KanbanColumnViewProps = ColumnProps & {
  members?: MemberWithUserOutput[];
  onAddTask: () => void;
  onDeleteColumn: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenTask: (task: TaskOutput) => void;
  onUpdateColumn?: (input: ColumnSettingsInput) => Promise<unknown> | unknown;
};
