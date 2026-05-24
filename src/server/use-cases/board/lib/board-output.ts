import type { Board } from "@/shared";

export const toBoardOutput = (board: Board) => ({
  id: board.id,
  projectId: board.projectId,
  name: board.name,
  position: board.position,
  createdAt: board.createdAt,
  updatedAt: board.updatedAt,
});
