"use client";

import { ColumnView } from "./column";
import { ConfirmableTaskCard } from "./task-card";
import type { KanbanBoardProps } from "./types";

export const KanbanBoard = ({
  column,
  isHovered,
  members = [],
  onAddTask,
  onDeleteColumn,
  onDeleteTask,
  onEditTask,
  onViewTask,
  tasks,
}: KanbanBoardProps) => {
  return (
    <ColumnView
      column={column}
      isHovered={isHovered}
      onAddTask={onAddTask}
      onDeleteColumn={() => onDeleteColumn(column.id)}
      tasks={tasks}
    >
      {tasks.map((task) => (
        <ConfirmableTaskCard
          key={task.id}
          members={members}
          onDelete={() => onDeleteTask(task.id)}
          onEdit={onEditTask}
          onView={onViewTask}
          task={task}
        />
      ))}
    </ColumnView>
  );
};
