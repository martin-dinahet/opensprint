"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type BoardOutput, useBoards, useDeleteBoard } from "@/entities/board";
import { type ColumnOutput, useColumns, useDeleteColumn } from "@/entities/column";
import { type MemberWithUserOutput, useProjectMembers } from "@/entities/member";
import { type TaskOutput, useDeleteTask, useMoveTask, useReorderTask } from "@/entities/task";
import { useKanbanDrag } from "./use-kanban-drag";

type ProjectKanbanContextValue = {
  activeBoardId: string;
  activeBoard?: BoardOutput;
  activeColumnId: string;
  boards: BoardOutput[];
  columns: ColumnOutput[];
  createBoardOpen: boolean;
  createColumnOpen: boolean;
  createTaskOpen: boolean;
  editTask: TaskOutput | null;
  isLoading: boolean;
  kanbanDrag: ReturnType<typeof useKanbanDrag>;
  members: MemberWithUserOutput[];
  openCreateBoard: () => void;
  openCreateColumn: () => void;
  openCreateTask: (columnId: string) => void;
  openEditTask: (task: TaskOutput) => void;
  openViewTask: (task: TaskOutput) => void;
  projectId: string;
  removeBoard: (boardId: string) => void;
  removeColumn: (columnId: string) => void;
  removeTask: (columnId: string, taskId: string) => void;
  setActiveBoardId: (boardId: string) => void;
  setCreateBoardOpen: (open: boolean) => void;
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
  const { data: boards = [], isLoading: boardsLoading } = useBoards(projectId);
  const [activeBoardId, setActiveBoardId] = useState("");
  const activeBoard = useMemo(
    () => boards.find((board) => board.id === activeBoardId) ?? boards[0],
    [activeBoardId, boards],
  );
  const { data: columns = [], isLoading: columnsLoading } = useColumns(activeBoard?.id ?? "");
  const { data: members = [] } = useProjectMembers(projectId);
  const deleteBoard = useDeleteBoard();
  const deleteColumn = useDeleteColumn();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const reorderTask = useReorderTask();
  const kanbanDrag = useKanbanDrag(moveTask, reorderTask);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createColumnOpen, setCreateColumnOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpenState] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState("");
  const [editTask, setEditTask] = useState<TaskOutput | null>(null);
  const [viewTask, setViewTask] = useState<TaskOutput | null>(null);

  useEffect(() => {
    if ((!activeBoardId || !boards.some((board) => board.id === activeBoardId)) && boards[0]) {
      setActiveBoardId(boards[0].id);
    }
  }, [activeBoardId, boards]);

  const setCreateTaskOpen = useCallback((open: boolean) => {
    setCreateTaskOpenState(open);
    if (!open) {
      setActiveColumnId("");
    }
  }, []);

  const value = useMemo<ProjectKanbanContextValue>(
    () => ({
      activeBoardId,
      activeBoard,
      activeColumnId,
      boards,
      columns,
      createBoardOpen,
      createColumnOpen,
      createTaskOpen,
      editTask,
      isLoading: boardsLoading || columnsLoading,
      kanbanDrag,
      members,
      openCreateBoard: () => setCreateBoardOpen(true),
      openCreateColumn: () => setCreateColumnOpen(true),
      openCreateTask: (columnId) => {
        setActiveColumnId(columnId);
        setCreateTaskOpenState(true);
      },
      openEditTask: setEditTask,
      openViewTask: setViewTask,
      projectId,
      removeBoard: (boardId) => deleteBoard.mutate({ projectId, boardId }),
      removeColumn: (columnId) => activeBoard && deleteColumn.mutate({ boardId: activeBoard.id, columnId }),
      removeTask: (columnId, taskId) => deleteTask.mutate({ columnId, taskId }),
      setActiveBoardId,
      setCreateBoardOpen,
      setCreateColumnOpen,
      setCreateTaskOpen,
      setEditTask,
      setViewTask,
      viewTask,
    }),
    [
      activeBoardId,
      activeBoard,
      activeColumnId,
      boards,
      boardsLoading,
      columns,
      columnsLoading,
      createBoardOpen,
      createColumnOpen,
      createTaskOpen,
      deleteBoard,
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
