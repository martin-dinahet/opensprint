export type {
  CreateColumnInput,
  ReorderColumnsInput,
  UpdateColumnInput,
} from "@/server/use-cases/column/dto";

import type { Column } from "@/shared/types";

export type ColumnOutput = {
  id: Column["id"];
  projectId: Column["projectId"];
  name: Column["name"];
  position: Column["position"];
  createdAt: string;
  updatedAt: string;
};

export type UpdateColumnOutput = Pick<ColumnOutput, "id" | "name" | "position" | "projectId"> & {
  updatedAt: string;
};
