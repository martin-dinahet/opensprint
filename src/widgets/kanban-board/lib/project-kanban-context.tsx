"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { type ColumnOutput, useColumns, useDeleteColumn, useUpdateColumn } from "@/entities/column";
import { type MemberWithUserOutput, useMembers } from "@/entities/member";
import { type TaskOutput, useDeleteTask, useMoveTask, useReorderTask } from "@/entities/task";
import { useKanbanDrag } from "./use-kanban-drag";

type ProjectKanbanContextValue = {
  activeColumnId: string;
  columns: ColumnOutput[];
  createColumnOpen: boolean;
  createTaskOpen: boolean;
  isLoading: boolean;
  kanbanDrag: ReturnType<typeof useKanbanDrag>;
  members: MemberWithUserOutput[];
  openCreateColumn: () => void;
  openCreateTask: (columnId: string) => void;
  openTask: (task: TaskOutput) => void;
  boardId: string;
  projectId: string;
  removeColumn: (columnId: string) => void;
  removeTask: (columnId: string, taskId: string) => void;
  renameColumn: (columnId: string, name: string) => Promise<unknown>;
  setCreateColumnOpen: (open: boolean) => void;
  setCreateTaskOpen: (open: boolean) => void;
  setSelectedTask: (task: TaskOutput | null) => void;
  selectedTask: TaskOutput | null;
};

const ProjectKanbanContext = createContext<ProjectKanbanContextValue | null>(null);

type Props = {
  boardId: string;
  children: ReactNode;
  projectId: string;
};

export const ProjectKanbanProvider = ({ boardId, children, projectId }: Props) => {
  const { data: columns = [], isLoading: columnsLoading } = useColumns(projectId, boardId);
  const { data: members = [] } = useMembers(projectId);
  const deleteColumn = useDeleteColumn();
  const updateColumn = useUpdateColumn();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const reorderTask = useReorderTask();
  const kanbanDrag = useKanbanDrag(moveTask, reorderTask);
  const [createColumnOpen, setCreateColumnOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpenState] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskOutput | null>(null);

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
      isLoading: columnsLoading,
      kanbanDrag,
      members,
      openCreateColumn: () => setCreateColumnOpen(true),
      openCreateTask: (columnId) => {
        setActiveColumnId(columnId);
        setCreateTaskOpenState(true);
      },
      openTask: setSelectedTask,
      boardId,
      projectId,
      removeColumn: (columnId) => deleteColumn.mutate({ boardId, projectId, columnId }),
      removeTask: (columnId, taskId) => deleteTask.mutate({ columnId, taskId }),
      renameColumn: (columnId, name) => updateColumn.mutateAsync({ boardId, projectId, columnId, data: { name } }),
      setCreateColumnOpen,
      setCreateTaskOpen,
      selectedTask,
      setSelectedTask,
    }),
    [
      activeColumnId,
      boardId,
      columns,
      columnsLoading,
      createColumnOpen,
      createTaskOpen,
      deleteColumn,
      deleteTask,
      kanbanDrag,
      members,
      projectId,
      selectedTask,
      setCreateTaskOpen,
      updateColumn,
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
