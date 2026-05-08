"use client";

import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useRef, useState } from "react";
import type { BoardOutput } from "@/entities/board";
import type { TaskOutput, useMoveTask } from "@/entities/task";

type DragData = {
  board?: BoardOutput;
  task?: TaskOutput;
  type?: "board" | "task";
};

type MoveTaskMutation = ReturnType<typeof useMoveTask>;

function getDragData(data: unknown): DragData | undefined {
  return data as DragData | undefined;
}

function getTargetBoardId(
  overId: string,
  overData: DragData | undefined,
  findTaskBoardId: (taskId: string) => string | null,
) {
  if (overData?.type === "board") return overId;
  if (overData?.type === "task") return findTaskBoardId(overId);

  return null;
}

function resetDragState(
  setActiveTask: (task: TaskOutput | null) => void,
  setOverBoardId: (boardId: string | null) => void,
  setDragInFlight: (dragInFlight: boolean) => void,
  setIsCrossBoardDrop: (isCrossBoardDrop: boolean) => void,
  setOptimisticBoards: (boards: Map<string, TaskOutput[]>) => void,
) {
  setActiveTask(null);
  setOverBoardId(null);
  setDragInFlight(false);
  setIsCrossBoardDrop(false);
  setOptimisticBoards(new Map());
}

export function useKanbanDrag(moveTask: MoveTaskMutation) {
  const serverTasksRef = useRef<Map<string, TaskOutput[]>>(new Map());
  const [activeTask, setActiveTask] = useState<TaskOutput | null>(null);
  const [dragInFlight, setDragInFlight] = useState(false);
  const [isCrossBoardDrop, setIsCrossBoardDrop] = useState(false);
  const [optimisticBoards, setOptimisticBoards] = useState<Map<string, TaskOutput[]>>(new Map());
  const [overBoardId, setOverBoardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const registerBoardTasks = useCallback((boardId: string, tasks: TaskOutput[]) => {
    serverTasksRef.current.set(boardId, tasks);
  }, []);

  const getBoardTasks = useCallback(
    (boardId: string) =>
      dragInFlight ? (optimisticBoards.get(boardId) ?? []) : (serverTasksRef.current.get(boardId) ?? []),
    [dragInFlight, optimisticBoards],
  );

  const findTaskBoardId = useCallback(
    (taskId: string) => {
      for (const [boardId, tasks] of optimisticBoards) {
        if (tasks.some((task) => task.id === taskId)) return boardId;
      }

      for (const [boardId, tasks] of serverTasksRef.current) {
        if (tasks.some((task) => task.id === taskId)) return boardId;
      }

      return null;
    },
    [optimisticBoards],
  );

  const reset = useCallback(() => {
    resetDragState(setActiveTask, setOverBoardId, setDragInFlight, setIsCrossBoardDrop, setOptimisticBoards);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = getDragData(event.active.data.current);

    if (data?.type !== "task" || !data.task) return;

    setActiveTask(data.task);
    setDragInFlight(true);
    setIsCrossBoardDrop(false);
    setOptimisticBoards(new Map(serverTasksRef.current));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) {
        setOverBoardId(null);
        setIsCrossBoardDrop(false);
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);
      const overData = getDragData(over.data.current);
      const targetBoardId = getTargetBoardId(overId, overData, findTaskBoardId);

      if (!targetBoardId) {
        setOverBoardId(null);
        setIsCrossBoardDrop(false);
        return;
      }

      setOverBoardId(targetBoardId);

      const sourceBoardId = findTaskBoardId(activeId);
      if (!sourceBoardId) return;

      setIsCrossBoardDrop(sourceBoardId !== targetBoardId);

      if (sourceBoardId === targetBoardId) {
        if (overData?.type !== "task" || overId === activeId) return;

        setOptimisticBoards((previousBoards) => {
          const nextBoards = new Map(previousBoards);
          const sourceTasks = [...(nextBoards.get(sourceBoardId) ?? [])];
          const oldIndex = sourceTasks.findIndex((task) => task.id === activeId);
          const newIndex = sourceTasks.findIndex((task) => task.id === overId);

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            nextBoards.set(sourceBoardId, arrayMove(sourceTasks, oldIndex, newIndex));
          }

          return nextBoards;
        });
        return;
      }

      setOptimisticBoards((previousBoards) => {
        const nextBoards = new Map(previousBoards);
        const sourceTasks = [...(nextBoards.get(sourceBoardId) ?? [])];
        const taskIndex = sourceTasks.findIndex((task) => task.id === activeId);

        if (taskIndex === -1) return previousBoards;

        const [movedTask] = sourceTasks.splice(taskIndex, 1);
        const targetTasks = [...(nextBoards.get(targetBoardId) ?? [])].filter((task) => task.id !== activeId);
        const movedTaskInTargetBoard = { ...movedTask, boardId: targetBoardId };

        if (overData?.type === "task") {
          const overIndex = targetTasks.findIndex((task) => task.id === overId);
          targetTasks.splice(overIndex >= 0 ? overIndex : targetTasks.length, 0, movedTaskInTargetBoard);
        } else {
          targetTasks.push(movedTaskInTargetBoard);
        }

        nextBoards.set(sourceBoardId, sourceTasks);
        nextBoards.set(targetBoardId, targetTasks);

        return nextBoards;
      });
    },
    [findTaskBoardId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const task = activeTask;

      setOverBoardId(null);

      if (!over || !task) {
        reset();
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);
      const overData = getDragData(over.data.current);
      const targetBoardId = getTargetBoardId(overId, overData, findTaskBoardId);

      if (!targetBoardId) {
        reset();
        return;
      }

      if (task.boardId === targetBoardId) {
        reset();
        return;
      }

      setDragInFlight(true);
      setIsCrossBoardDrop(true);
      setOptimisticBoards((previousBoards) => {
        const nextBoards = new Map(previousBoards.size > 0 ? previousBoards : serverTasksRef.current);

        for (const [boardId, tasks] of nextBoards) {
          nextBoards.set(
            boardId,
            tasks.filter((candidate) => candidate.id !== activeId),
          );
        }

        const targetTasks = [...(nextBoards.get(targetBoardId) ?? [])];
        const movedTask = { ...task, boardId: targetBoardId };

        if (overData?.type === "task" && overId !== activeId) {
          const overIndex = targetTasks.findIndex((candidate) => candidate.id === overId);
          targetTasks.splice(overIndex >= 0 ? overIndex : targetTasks.length, 0, movedTask);
        } else {
          targetTasks.push(movedTask);
        }

        nextBoards.set(targetBoardId, targetTasks);

        return nextBoards;
      });
      setActiveTask(null);

      void moveTask
        .mutateAsync({
          data: { boardId: targetBoardId },
          task: { ...task, boardId: targetBoardId },
          taskId: activeId,
        })
        .then(reset)
        .catch(reset);
    },
    [activeTask, findTaskBoardId, moveTask, reset],
  );

  return useMemo(
    () => ({
      activeTask,
      dragInFlight,
      getBoardTasks,
      handleDragCancel: reset,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      isCrossBoardDrop,
      overBoardId,
      registerBoardTasks,
      sensors,
    }),
    [
      activeTask,
      dragInFlight,
      getBoardTasks,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      isCrossBoardDrop,
      overBoardId,
      registerBoardTasks,
      reset,
      sensors,
    ],
  );
}
