"use client";

import {
  type CollisionDetection,
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { use, useCallback, useRef, useState } from "react";
import { CreateBoardDialog } from "@/components/features/create-board-dialog";
import { CreateTaskDialog } from "@/components/features/create-task-dialog";
import { EditTaskDialog } from "@/components/features/edit-task-dialog";
import { KanbanBoard } from "@/components/features/kanban-board";
import { TaskCard } from "@/components/features/task-card";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  useBoards,
  useCreateBoard,
  useCreateTask,
  useDeleteTask,
  useMoveTask,
  useTasks,
  useUpdateTask,
} from "@/lib/queries";
import type { BoardOutput, TaskOutput } from "@/lib/types";

// ---------------------------------------------------------------------------
// Custom collision detection
//
// Strategy:
//   1. Try pointerWithin first — uses raw pointer coordinates, so the column
//      you're "in" matches exactly where your cursor is, not where the dragged
//      card's bounding box is. This fixes the "have to drag all the way to the
//      far edge" problem with closestCorners.
//   2. If the pointer isn't inside any droppable (e.g. in the gap between
//      columns), fall back to closestCorners for the nearest target.
// ---------------------------------------------------------------------------
const kanbanCollisionDetection: CollisionDetection = (args) => {
  // Phase 1: exact pointer hit-test
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    // Prefer the board column hit over any task inside it, so the column
    // highlight fires as soon as the cursor crosses the border.
    const boardHit = pointerCollisions.find(
      (c) => (c.data?.droppableContainer?.data?.current as { type?: string } | undefined)?.type === "board",
    );
    if (boardHit) return [boardHit];
    return pointerCollisions;
  }

  // Phase 2: cursor is in dead space between columns — nearest wins
  return closestCorners(args);
};

// ---------------------------------------------------------------------------
// Per-board column — useTasks is called here (a real component), never in a
// loop or .map(), so the Rules of Hooks are always satisfied.
// ---------------------------------------------------------------------------
function BoardWithTasks({
  board,
  dragInFlight,
  optimisticTasks,
  movedTaskId,
  onAddTask,
  onEditTask,
  onDeleteTask,
  isHovered,
  onTasksReady,
  onServerConfirmed,
}: {
  board: BoardOutput;
  dragInFlight: boolean;
  optimisticTasks: TaskOutput[];
  /** The task id that was moved cross-board, so we can detect when the
   *  server data has caught up before switching off optimistic mode. */
  movedTaskId: string | null;
  onAddTask: () => void;
  onEditTask: (task: TaskOutput) => void;
  onDeleteTask: (taskId: string) => void;
  isHovered: boolean;
  onTasksReady: (boardId: string, tasks: TaskOutput[]) => void;
  /** Called by the destination board once fresh server data contains the task */
  onServerConfirmed: () => void;
}) {
  const { data: serverTasks = [] } = useTasks(board.id);

  // Sync server data into parent ref synchronously.
  onTasksReady(board.id, serverTasks);

  // Once the destination board's server data actually contains the moved task,
  // it's safe to hand off from optimistic → server data with no visible flash.
  const serverHasTask = movedTaskId !== null && serverTasks.some((t) => t.id === movedTaskId);
  if (serverHasTask && dragInFlight) {
    // Use a microtask to avoid setState-during-render on the parent
    Promise.resolve().then(onServerConfirmed);
  }

  const tasks = dragInFlight ? optimisticTasks : serverTasks;

  return (
    <KanbanBoard
      board={board}
      tasks={tasks}
      onAddTask={onAddTask}
      onEditTask={onEditTask}
      onDeleteTask={onDeleteTask}
      isHovered={isHovered}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ id: string }> };

export default function KanbanPage({ params }: Props) {
  const { id: projectId } = use(params);
  const session = authClient.useSession();
  const { data: boards, isLoading } = useBoards(projectId);
  const createBoard = useCreateBoard();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();

  // ------------------------------------------------------------------
  // Server task map (ref, not state — writes don't need to trigger renders)
  // boardId → TaskOutput[]
  // ------------------------------------------------------------------
  const serverTasksRef = useRef<Map<string, TaskOutput[]>>(new Map());

  const handleTasksReady = useCallback((boardId: string, tasks: TaskOutput[]) => {
    serverTasksRef.current.set(boardId, tasks);
  }, []);

  // ------------------------------------------------------------------
  // Optimistic board state — only populated while a drag is in flight.
  // An absent key means "use server data for that board".
  // boardId → TaskOutput[]
  // ------------------------------------------------------------------
  const [optimisticBoards, setOptimisticBoards] = useState<Map<string, TaskOutput[]>>(new Map());

  // True from dragStart until the destination board's server data confirms
  // the moved task has arrived. This ensures we never flash stale data.
  const [dragInFlight, setDragInFlight] = useState(false);

  // The task id being moved cross-board, used to detect server confirmation.
  const [movedTaskId, setMovedTaskId] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Drag state
  // ------------------------------------------------------------------
  const [activeTask, setActiveTask] = useState<TaskOutput | null>(null);
  const [overBoardId, setOverBoardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ------------------------------------------------------------------
  // Dialogs
  // ------------------------------------------------------------------
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const [editTask, setEditTask] = useState<TaskOutput | null>(null);

  // ------------------------------------------------------------------
  // CRUD handlers
  // ------------------------------------------------------------------
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    await createBoard.mutateAsync({ projectId, data: { name: newBoardName } });
    setCreateBoardOpen(false);
    setNewBoardName("");
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask.mutateAsync({
      boardId: activeBoardId,
      data: {
        title: newTaskTitle,
        description: newTaskDesc || undefined,
        priority: newTaskPriority,
      },
    });
    setCreateTaskOpen(false);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("medium");
  };

  const handleUpdateTask = async () => {
    if (!editTask) return;
    await updateTask.mutateAsync({
      boardId: editTask.boardId,
      taskId: editTask.id,
      data: { title: editTask.title, priority: editTask.priority },
    });
    setEditTask(null);
  };

  // Called by the destination BoardWithTasks once it sees the moved task
  // in its fresh server data — this is the earliest safe moment to drop
  // the optimistic override without any visible flash.
  const handleServerConfirmed = useCallback(() => {
    setDragInFlight(false);
    setMovedTaskId(null);
    setOptimisticBoards(new Map());
  }, []);

  // ------------------------------------------------------------------
  // Helper: find which board a task currently lives in, checking the
  // optimistic state first so cross-board drags resolve correctly.
  // ------------------------------------------------------------------
  const getTaskBoardId = useCallback(
    (taskId: string): string | null => {
      for (const [boardId, tasks] of optimisticBoards) {
        if (tasks.some((t) => t.id === taskId)) return boardId;
      }
      for (const [boardId, tasks] of serverTasksRef.current) {
        if (tasks.some((t) => t.id === taskId)) return boardId;
      }
      return null;
    },
    [optimisticBoards],
  );

  // ------------------------------------------------------------------
  // DnD handlers
  // ------------------------------------------------------------------
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { type?: string; task?: TaskOutput } | undefined;

    if (data?.type === "task" && data.task) {
      setActiveTask(data.task);
      setDragInFlight(true);
      // Snapshot server state into optimistic map so we can mutate freely
      setOptimisticBoards(new Map(serverTasksRef.current));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setOverBoardId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const overData = over.data.current as { type?: string; board?: BoardOutput; task?: TaskOutput } | undefined;

    // Resolve which board the pointer is currently over
    let targetBoardId: string | null = null;
    if (overData?.type === "board") {
      targetBoardId = overId;
    } else if (overData?.type === "task") {
      targetBoardId = getTaskBoardId(overId);
    }

    if (!targetBoardId) {
      setOverBoardId(null);
      return;
    }

    setOverBoardId(targetBoardId);

    const sourceBoardId = getTaskBoardId(activeId);
    if (!sourceBoardId) return;

    if (sourceBoardId === targetBoardId) {
      // Same-board reorder
      if (overData?.type === "task" && overId !== activeId) {
        setOptimisticBoards((prev) => {
          const next = new Map(prev);
          const col = [...(next.get(sourceBoardId) ?? [])];
          const oldIdx = col.findIndex((t) => t.id === activeId);
          const newIdx = col.findIndex((t) => t.id === overId);
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            next.set(sourceBoardId, arrayMove(col, oldIdx, newIdx));
          }
          return next;
        });
      }
      return;
    }

    // Cross-board move: remove from source, insert at target position
    setOptimisticBoards((prev) => {
      const next = new Map(prev);

      const sourceCol = [...(next.get(sourceBoardId) ?? [])];
      const taskIdx = sourceCol.findIndex((t) => t.id === activeId);
      if (taskIdx === -1) return prev;
      const [movedTask] = sourceCol.splice(taskIdx, 1);
      next.set(sourceBoardId, sourceCol);

      const targetCol = [...(next.get(targetBoardId!) ?? [])];
      if (overData?.type === "task") {
        const overIdx = targetCol.findIndex((t) => t.id === overId);
        targetCol.splice(overIdx >= 0 ? overIdx : targetCol.length, 0, {
          ...movedTask,
          boardId: targetBoardId!,
        });
      } else {
        targetCol.push({ ...movedTask, boardId: targetBoardId! });
      }
      next.set(targetBoardId!, targetCol);

      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const task = activeTask;

    setOverBoardId(null);

    if (!over || !task) {
      setActiveTask(null);
      setDragInFlight(false);
      setMovedTaskId(null);
      setOptimisticBoards(new Map());
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current as { type?: string; board?: BoardOutput; task?: TaskOutput } | undefined;

    let targetBoardId: string | null = null;
    if (overData?.type === "board") {
      targetBoardId = overId;
    } else if (overData?.type === "task") {
      targetBoardId = getTaskBoardId(overId);
    }

    if (!targetBoardId) {
      setActiveTask(null);
      setDragInFlight(false);
      setMovedTaskId(null);
      setOptimisticBoards(new Map());
      return;
    }

    if (task.boardId !== targetBoardId) {
      setMovedTaskId(activeId);
      moveTask.mutate(
        { taskId: activeId, data: { boardId: targetBoardId } },
        {
          onSettled: () => {
            setActiveTask(null);
          },
          onError: () => {
            setDragInFlight(false);
            setMovedTaskId(null);
            setOptimisticBoards(new Map());
          },
        },
      );
    } else {
      setActiveTask(null);
      setDragInFlight(false);
      setMovedTaskId(null);
      setOptimisticBoards(new Map());
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverBoardId(null);
    setDragInFlight(false);
    setMovedTaskId(null);
    setOptimisticBoards(new Map());
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!session.data?.user) return <LoadingScreen />;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Kanban</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => authClient.signOut()}>
            Sign out
          </Button>
        </header>

        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <LoadingScreen />
          ) : (
            <div className="flex h-full gap-3 p-4">
              {boards?.map((board) => (
                <BoardWithTasks
                  key={board.id}
                  board={board}
                  dragInFlight={dragInFlight}
                  optimisticTasks={
                    dragInFlight ? (optimisticBoards.get(board.id) ?? []) : (serverTasksRef.current.get(board.id) ?? [])
                  }
                  movedTaskId={movedTaskId}
                  onServerConfirmed={handleServerConfirmed}
                  onAddTask={() => {
                    setActiveBoardId(board.id);
                    setCreateTaskOpen(true);
                  }}
                  onEditTask={(task) => setEditTask(task)}
                  onDeleteTask={(taskId) => deleteTask.mutate({ boardId: board.id, taskId })}
                  isHovered={overBoardId === board.id}
                  onTasksReady={handleTasksReady}
                />
              ))}

              <Button
                variant="ghost"
                className="h-12 w-72 shrink-0 border-2 border-dashed border-border hover:border-solid"
                onClick={() => setCreateBoardOpen(true)}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </div>
          )}
        </main>
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeTask ? <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isOverlay /> : null}
      </DragOverlay>

      <CreateBoardDialog
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        onCreate={handleCreateBoard}
        isPending={createBoard.isPending}
        name={newBoardName}
        onNameChange={setNewBoardName}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreate={handleCreateTask}
        isPending={createTask.isPending}
        title={newTaskTitle}
        onTitleChange={setNewTaskTitle}
        description={newTaskDesc}
        onDescriptionChange={setNewTaskDesc}
        priority={newTaskPriority}
        onPriorityChange={setNewTaskPriority}
      />

      <EditTaskDialog
        open={!!editTask}
        onOpenChange={(open) => !open && setEditTask(null)}
        onSave={handleUpdateTask}
        task={editTask}
        onTaskChange={setEditTask}
      />
    </DndContext>
  );
}
