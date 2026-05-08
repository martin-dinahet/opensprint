"use client";

import { useEffect } from "react";
import { KanbanBoard } from "@/features/board/components/kanban-board";
import type { BoardOutput } from "@/features/board/types";
import { useTasks } from "@/features/task/hooks";
import type { TaskOutput } from "@/features/task/types";

type Props = {
  board: BoardOutput;
  dragInFlight: boolean;
  optimisticTasks: TaskOutput[];
  isHovered: boolean;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskOutput) => void;
  onTasksReady: (boardId: string, tasks: TaskOutput[]) => void;
};

export function BoardColumn({
  board,
  dragInFlight,
  optimisticTasks,
  isHovered,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onTasksReady,
}: Props) {
  const { data: serverTasks = [] } = useTasks(board.id);
  const tasks = dragInFlight ? optimisticTasks : serverTasks;

  useEffect(() => {
    onTasksReady(board.id, serverTasks);
  }, [board.id, onTasksReady, serverTasks]);

  return (
    <KanbanBoard
      board={board}
      isHovered={isHovered}
      onAddTask={onAddTask}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      tasks={tasks}
    />
  );
}
