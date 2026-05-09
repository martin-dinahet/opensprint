"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useBoards, useDeleteBoard } from "@/entities/board";
import { type MemberWithUserOutput, useProjectMembers } from "@/entities/member";
import { type TaskOutput, useDeleteTask, useMoveTask, useReorderTask } from "@/entities/task";
import { useKanbanDrag } from "./use-kanban-drag";

type ProjectKanbanContextValue = {
  activeBoardId: string;
  boards: ReturnType<typeof useBoards>["data"];
  createBoardOpen: boolean;
  createTaskOpen: boolean;
  editTask: TaskOutput | null;
  isLoading: boolean;
  kanbanDrag: ReturnType<typeof useKanbanDrag>;
  members: MemberWithUserOutput[];
  openCreateBoard: () => void;
  openCreateTask: (boardId: string) => void;
  openEditTask: (task: TaskOutput) => void;
  openViewTask: (task: TaskOutput) => void;
  projectId: string;
  removeBoard: (boardId: string) => void;
  removeTask: (boardId: string, taskId: string) => void;
  setCreateBoardOpen: (open: boolean) => void;
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
  const { data: boards, isLoading } = useBoards(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const deleteBoard = useDeleteBoard();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const reorderTask = useReorderTask();
  const kanbanDrag = useKanbanDrag(moveTask, reorderTask);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpenState] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState("");
  const [editTask, setEditTask] = useState<TaskOutput | null>(null);
  const [viewTask, setViewTask] = useState<TaskOutput | null>(null);

  const setCreateTaskOpen = useCallback((open: boolean) => {
    setCreateTaskOpenState(open);
    if (!open) {
      setActiveBoardId("");
    }
  }, []);

  const value = useMemo<ProjectKanbanContextValue>(
    () => ({
      activeBoardId,
      boards,
      createBoardOpen,
      createTaskOpen,
      editTask,
      isLoading,
      kanbanDrag,
      members,
      openCreateBoard: () => setCreateBoardOpen(true),
      openCreateTask: (boardId) => {
        setActiveBoardId(boardId);
        setCreateTaskOpenState(true);
      },
      openEditTask: setEditTask,
      openViewTask: setViewTask,
      projectId,
      removeBoard: (boardId) => deleteBoard.mutate({ projectId, boardId }),
      removeTask: (boardId, taskId) => deleteTask.mutate({ boardId, taskId }),
      setCreateBoardOpen,
      setCreateTaskOpen,
      setEditTask,
      setViewTask,
      viewTask,
    }),
    [
      activeBoardId,
      boards,
      createBoardOpen,
      createTaskOpen,
      deleteBoard,
      deleteTask,
      editTask,
      isLoading,
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
