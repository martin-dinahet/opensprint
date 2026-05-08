"use client";

import { DndContext, DragOverlay, MeasuringStrategy } from "@dnd-kit/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { BoardColumn } from "@/features/board/components/board-column";
import { CreateBoardDialog } from "@/features/board/components/create-board-dialog";
import { useBoards, useCreateBoard } from "@/features/board/hooks";
import { useKanbanDrag } from "@/features/board/hooks/use-kanban-drag";
import { kanbanCollisionDetection } from "@/features/board/lib/kanban-dnd";
import { AppHeader } from "@/features/shared/components/app-header";
import { CreateTaskDialog } from "@/features/task/components/create-task-dialog";
import { EditTaskDialog } from "@/features/task/components/edit-task-dialog";
import { TaskCardContent } from "@/features/task/components/task-card";
import { useCreateTask, useDeleteTask, useMoveTask, useUpdateTask } from "@/features/task/hooks";
import type { TaskOutput, TaskPriority } from "@/features/task/types";
import { authClient } from "@/lib/auth-client";

type Props = {
  projectId: string;
};

const DEFAULT_TASK_PRIORITY: TaskPriority = "medium";

export function ProjectKanbanPage({ projectId }: Props) {
  const session = authClient.useSession();
  const { data: boards, isLoading } = useBoards(projectId);
  const createBoard = useCreateBoard();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
  const kanbanDrag = useKanbanDrag(moveTask);

  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY);
  const [editTask, setEditTask] = useState<TaskOutput | null>(null);

  const resetCreateTaskDialog = () => {
    setCreateTaskOpen(false);
    setActiveBoardId("");
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority(DEFAULT_TASK_PRIORITY);
  };

  const handleCreateBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;

    await createBoard.mutateAsync({ data: { name }, projectId });
    setCreateBoardOpen(false);
    setNewBoardName("");
  };

  const handleCreateTask = async () => {
    const title = newTaskTitle.trim();
    if (!title || !activeBoardId) return;

    await createTask.mutateAsync({
      boardId: activeBoardId,
      data: {
        description: newTaskDesc.trim() || undefined,
        priority: newTaskPriority,
        title,
      },
    });
    resetCreateTaskDialog();
  };

  const handleUpdateTask = async () => {
    if (!editTask?.title.trim()) return;

    await updateTask.mutateAsync({
      boardId: editTask.boardId,
      data: {
        description: editTask.description?.trim() || undefined,
        priority: editTask.priority,
        title: editTask.title.trim(),
      },
      taskId: editTask.id,
    });
    setEditTask(null);
  };

  const openCreateTaskDialog = (boardId: string) => {
    setActiveBoardId(boardId);
    setCreateTaskOpen(true);
  };

  if (!session.data?.user) return <LoadingScreen />;

  return (
    <DndContext
      collisionDetection={kanbanCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragCancel={kanbanDrag.handleDragCancel}
      onDragEnd={kanbanDrag.handleDragEnd}
      onDragOver={kanbanDrag.handleDragOver}
      onDragStart={kanbanDrag.handleDragStart}
      sensors={kanbanDrag.sensors}
    >
      <div className="flex h-screen flex-col overflow-hidden">
        <AppHeader
          className="shrink-0"
          leading={
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Projects
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Kanban</span>
            </div>
          }
        />

        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <div className="flex h-full gap-3 p-4">
              {boards?.map((board) => (
                <BoardColumn
                  board={board}
                  dragInFlight={kanbanDrag.dragInFlight}
                  isHovered={kanbanDrag.overBoardId === board.id}
                  key={board.id}
                  onAddTask={() => openCreateTaskDialog(board.id)}
                  onDeleteTask={(taskId) => deleteTask.mutate({ boardId: board.id, taskId })}
                  onEditTask={setEditTask}
                  onTasksReady={kanbanDrag.registerBoardTasks}
                  optimisticTasks={kanbanDrag.getBoardTasks(board.id)}
                />
              ))}

              <Button
                className="h-12 w-72 shrink-0 border-2 border-dashed border-border hover:border-solid"
                onClick={() => setCreateBoardOpen(true)}
                variant="ghost"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </div>
          )}
        </main>
      </div>

      <DragOverlay
        dropAnimation={
          kanbanDrag.isCrossBoardDrop
            ? null
            : {
                duration: 180,
                easing: "cubic-bezier(0.2, 0, 0, 1)",
              }
        }
      >
        {kanbanDrag.activeTask ? (
          <TaskCardContent isOverlay onDelete={() => {}} onEdit={() => {}} task={kanbanDrag.activeTask} />
        ) : null}
      </DragOverlay>

      <CreateBoardDialog
        isPending={createBoard.isPending}
        name={newBoardName}
        onCreate={handleCreateBoard}
        onNameChange={setNewBoardName}
        onOpenChange={setCreateBoardOpen}
        open={createBoardOpen}
      />

      <CreateTaskDialog
        description={newTaskDesc}
        isPending={createTask.isPending}
        onCreate={handleCreateTask}
        onDescriptionChange={setNewTaskDesc}
        onOpenChange={(open) => {
          if (!open) resetCreateTaskDialog();
          else setCreateTaskOpen(open);
        }}
        onPriorityChange={setNewTaskPriority}
        onTitleChange={setNewTaskTitle}
        open={createTaskOpen}
        priority={newTaskPriority}
        title={newTaskTitle}
      />

      <EditTaskDialog
        onOpenChange={(open) => !open && setEditTask(null)}
        onSave={handleUpdateTask}
        onTaskChange={setEditTask}
        open={!!editTask}
        task={editTask}
      />
    </DndContext>
  );
}
