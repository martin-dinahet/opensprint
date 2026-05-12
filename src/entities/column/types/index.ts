export type {
  CreateColumnInput,
  ReorderColumnsInput,
  UpdateColumnInput,
} from "@/server/use-cases/column/dto";

export type ColumnOutput = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateColumnOutput = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  updatedAt: string;
};
