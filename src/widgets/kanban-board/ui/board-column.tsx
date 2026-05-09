"use client";

import { useEffect } from "react";
import type { ColumnOutput } from "@/entities/column";
import { useTasks } from "@/entities/task";
import { useProjectKanban } from "../lib/project-kanban-context";
import { Kanban } from "./kanban";

type Props = {
  column: ColumnOutput;
};

export function BoardColumn({ column }: Props) {
  const { kanbanDrag } = useProjectKanban();
  const { data: serverTasks = [] } = useTasks(column.id);
  const tasks = kanbanDrag.dragInFlight ? kanbanDrag.getColumnTasks(column.id) : serverTasks;

  useEffect(() => {
    kanbanDrag.registerColumnTasks(column.id, serverTasks);
  }, [column.id, kanbanDrag, serverTasks]);

  return <Kanban.Column column={column} isHovered={kanbanDrag.overColumnId === column.id} tasks={tasks} />;
}
