export type {
  CreateBoardInput,
  ReorderBoardsInput,
  UpdateBoardInput,
} from "@/server/features/board/dto";

export type BoardOutput = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateBoardOutput = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  updatedAt: string;
};
