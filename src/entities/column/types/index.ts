export type {
  CreateColumnInput,
  ReorderColumnsInput,
  UpdateColumnInput,
} from "@/server/use-cases/column/dto";

import type { Column } from "@/shared";

export type ColumnOutput = {
  id: Column["id"];
  projectId: string;
  boardId: Column["boardId"];
  name: Column["name"];
  position: Column["position"];
  createdAt: string;
  updatedAt: string;
};

export type UpdateColumnOutput = Pick<ColumnOutput, "boardId" | "id" | "name" | "position" | "projectId"> & {
  updatedAt: string;
};
