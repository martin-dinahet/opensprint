"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { type ColumnOutput, useColumns, useDeleteColumn } from "@/entities/column";
import { type MemberWithUserOutput, useMembers } from "@/entities/member";
import { type TaskOutput, useDeleteTask, useMoveTask, useReorderTask } from "@/entities/task";
import { useKanbanDrag } from "./use-kanban-drag";

type ProjectKanbanContextValue = {
  activeColumnId: string;
  columns: ColumnOutput[];
  createColumnOpen: boolean;
  createTaskOpen: boolean;
  editTask: TaskOutput | null;
  isLoading: boolean;
  kanbanDrag: ReturnType<typeof useKanbanDrag>;
  members: MemberWithUserOutput[];
  openCreateColumn: () => void;
  openCreateTask: (columnId: string) => void;
  openEditTask: (task: TaskOutput) => void;
  openViewTask: (task: TaskOutput) => void;
  projectId: string;
  removeColumn: (columnId: string) => void;
  removeTask: (columnId: string, taskId: string) => void;
  setCreateColumnOpen: (open: boolean) => void;
  setCreateTaskOpen: (open: boolean) => void;
  setEditTask: (task: TaskOutput | null) => void;
  setViewTask: (task: TaskOutput | null) => void;
  viewTask: TaskOutput | null;
};

const ProjectKanbanContext = createContext<ProjectKanbanContextValue | null>(null);

type Props = {
  children: ReactNode;
  projectId: string;
};

export const ProjectKanbanProvider = ({ children, projectId }: Props) => {
  const { data: columns = [], isLoading: columnsLoading } = useColumns(projectId);
  const { data: members = [] } = useMembers(projectId);
  const deleteColumn = useDeleteColumn();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const reorderTask = useReorderTask();
  const kanbanDrag = useKanbanDrag(moveTask, reorderTask);
  const [createColumnOpen, setCreateColumnOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpenState] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState("");
  const [editTask, setEditTask] = useState<TaskOutput | null>(null);
  const [viewTask, setViewTask] = useState<TaskOutput | null>(null);

  const setCreateTaskOpen = useCallback((open: boolean) => {
    setCreateTaskOpenState(open);
    if (!open) {
      setActiveColumnId("");
    }
  }, []);

  const value = useMemo<ProjectKanbanContextValue>(
    () => ({
      activeColumnId,
      columns,
      createColumnOpen,
      createTaskOpen,
      editTask,
      isLoading: columnsLoading,
      kanbanDrag,
      members,
      openCreateColumn: () => setCreateColumnOpen(true),
      openCreateTask: (columnId) => {
        setActiveColumnId(columnId);
        setCreateTaskOpenState(true);
      },
      openEditTask: setEditTask,
      openViewTask: setViewTask,
      projectId,
      removeColumn: (columnId) => deleteColumn.mutate({ projectId, columnId }),
      removeTask: (columnId, taskId) => deleteTask.mutate({ columnId, taskId }),
      setCreateColumnOpen,
      setCreateTaskOpen,
      setEditTask,
      setViewTask,
      viewTask,
    }),
    [
      activeColumnId,
      columns,
      columnsLoading,
      createColumnOpen,
      createTaskOpen,
      deleteColumn,
      deleteTask,
      editTask,
      kanbanDrag,
      members,
      projectId,
      setCreateTaskOpen,
      viewTask,
    ],
  );

  return <ProjectKanbanContext.Provider value={value}>{children}</ProjectKanbanContext.Provider>;
};

export const useProjectKanban = () => {
  const context = useContext(ProjectKanbanContext);
  if (!context) {
    throw new Error("useProjectKanban must be used within ProjectKanbanProvider");
  }

  return context;
};
