"use client";

import { useEffect } from "react";
import type { BoardOutput } from "@/entities/board";
import { useTasks } from "@/entities/task";
import { Kanban, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  board: BoardOutput;
};

export function BoardColumn({ board }: Props) {
  const { kanbanDrag } = useProjectKanban();
  const { data: serverTasks = [] } = useTasks(board.id);
  const tasks = kanbanDrag.dragInFlight ? kanbanDrag.getBoardTasks(board.id) : serverTasks;

  useEffect(() => {
    kanbanDrag.registerBoardTasks(board.id, serverTasks);
  }, [board.id, kanbanDrag, serverTasks]);

  return <Kanban.Column board={board} isHovered={kanbanDrag.overBoardId === board.id} tasks={tasks} />;
}
