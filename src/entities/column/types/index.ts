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
  kind: Column["kind"];
  wipLimit: Column["wipLimit"];
  position: Column["position"];
  createdAt: string;
  updatedAt: string;
};

export type UpdateColumnOutput = Pick<
  ColumnOutput,
  "boardId" | "id" | "kind" | "name" | "position" | "projectId" | "wipLimit"
> & {
  updatedAt: string;
};
