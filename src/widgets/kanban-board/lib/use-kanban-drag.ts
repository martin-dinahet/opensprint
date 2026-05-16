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
import type { ColumnOutput } from "@/entities/column";
import type { TaskOutput, useMoveTask, useReorderTask } from "@/entities/task";

type DragData = {
  column?: ColumnOutput;
  task?: TaskOutput;
  type?: "column" | "task";
};

type MoveTaskMutation = ReturnType<typeof useMoveTask>;
type ReorderTaskMutation = ReturnType<typeof useReorderTask>;

const getDragData = (data: unknown): DragData | undefined => {
  return data as DragData | undefined;
};

const getTargetColumnId = (
  overId: string,
  overData: DragData | undefined,
  findTaskColumnId: (taskId: string) => string | null,
) => {
  if (overData?.type === "column") return overId;
  if (overData?.type === "task") return findTaskColumnId(overId);

  return null;
};

const resetDragState = (
  setActiveTask: (task: TaskOutput | null) => void,
  setOverColumnId: (columnId: string | null) => void,
  setDragInFlight: (dragInFlight: boolean) => void,
  setIsCrossColumnDrop: (isCrossColumnDrop: boolean) => void,
  setOptimisticColumns: (columns: Map<string, TaskOutput[]>) => void,
) => {
  setActiveTask(null);
  setOverColumnId(null);
  setDragInFlight(false);
  setIsCrossColumnDrop(false);
  setOptimisticColumns(new Map());
};

export const useKanbanDrag = (moveTask: MoveTaskMutation, reorderTask: ReorderTaskMutation) => {
  const serverTasksRef = useRef<Map<string, TaskOutput[]>>(new Map());
  const [activeTask, setActiveTask] = useState<TaskOutput | null>(null);
  const [dragInFlight, setDragInFlight] = useState(false);
  const [isCrossColumnDrop, setIsCrossColumnDrop] = useState(false);
  const [optimisticColumns, setOptimisticColumns] = useState<Map<string, TaskOutput[]>>(new Map());
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const registerColumnTasks = useCallback((columnId: string, tasks: TaskOutput[]) => {
    serverTasksRef.current.set(columnId, tasks);
  }, []);

  const getColumnTasks = useCallback(
    (columnId: string) =>
      dragInFlight ? (optimisticColumns.get(columnId) ?? []) : (serverTasksRef.current.get(columnId) ?? []),
    [dragInFlight, optimisticColumns],
  );

  const findTaskColumnId = useCallback(
    (taskId: string) => {
      for (const [columnId, tasks] of optimisticColumns) {
        if (tasks.some((task) => task.id === taskId)) return columnId;
      }

      for (const [columnId, tasks] of serverTasksRef.current) {
        if (tasks.some((task) => task.id === taskId)) return columnId;
      }

      return null;
    },
    [optimisticColumns],
  );

  const reset = useCallback(() => {
    resetDragState(setActiveTask, setOverColumnId, setDragInFlight, setIsCrossColumnDrop, setOptimisticColumns);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = getDragData(event.active.data.current);

    if (data?.type !== "task" || !data.task) return;

    setActiveTask(data.task);
    setDragInFlight(true);
    setIsCrossColumnDrop(false);
    setOptimisticColumns(new Map(serverTasksRef.current));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) {
        setOverColumnId(null);
        setIsCrossColumnDrop(false);
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);
      const overData = getDragData(over.data.current);
      const targetColumnId = getTargetColumnId(overId, overData, findTaskColumnId);

      if (!targetColumnId) {
        setOverColumnId(null);
        setIsCrossColumnDrop(false);
        return;
      }

      setOverColumnId(targetColumnId);

      const sourceColumnId = findTaskColumnId(activeId);
      if (!sourceColumnId) return;

      setIsCrossColumnDrop(sourceColumnId !== targetColumnId);

      if (sourceColumnId === targetColumnId) {
        if (overData?.type !== "task" || overId === activeId) return;

        setOptimisticColumns((previousColumns) => {
          const nextColumns = new Map(previousColumns);
          const sourceTasks = [...(nextColumns.get(sourceColumnId) ?? [])];
          const oldIndex = sourceTasks.findIndex((task) => task.id === activeId);
          const newIndex = sourceTasks.findIndex((task) => task.id === overId);

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            nextColumns.set(sourceColumnId, arrayMove(sourceTasks, oldIndex, newIndex));
          }

          return nextColumns;
        });
        return;
      }

      setOptimisticColumns((previousColumns) => {
        const nextColumns = new Map(previousColumns);
        const sourceTasks = [...(nextColumns.get(sourceColumnId) ?? [])];
        const taskIndex = sourceTasks.findIndex((task) => task.id === activeId);

        if (taskIndex === -1) return previousColumns;

        const [movedTask] = sourceTasks.splice(taskIndex, 1);
        const targetTasks = [...(nextColumns.get(targetColumnId) ?? [])].filter((task) => task.id !== activeId);
        const movedTaskInTargetColumn = { ...movedTask, columnId: targetColumnId };

        if (overData?.type === "task") {
          const overIndex = targetTasks.findIndex((task) => task.id === overId);
          targetTasks.splice(overIndex >= 0 ? overIndex : targetTasks.length, 0, movedTaskInTargetColumn);
        } else {
          targetTasks.push(movedTaskInTargetColumn);
        }

        nextColumns.set(sourceColumnId, sourceTasks);
        nextColumns.set(targetColumnId, targetTasks);

        return nextColumns;
      });
    },
    [findTaskColumnId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const task = activeTask;

      setOverColumnId(null);

      if (!over || !task) {
        reset();
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);
      const overData = getDragData(over.data.current);
      const targetColumnId = getTargetColumnId(overId, overData, findTaskColumnId);

      if (!targetColumnId) {
        reset();
        return;
      }

      if (task.columnId === targetColumnId) {
        const reorderedTasks =
          optimisticColumns.get(targetColumnId) ?? serverTasksRef.current.get(targetColumnId) ?? [];
        const position = reorderedTasks.findIndex((candidate) => candidate.id === activeId);

        if (position < 0 || position === task.position) {
          reset();
          return;
        }

        setDragInFlight(true);
        setIsCrossColumnDrop(false);
        setActiveTask(null);

        void reorderTask
          .mutateAsync({
            position,
            taskId: activeId,
          })
          .then(reset, reset);
        return;
      }

      const currentTargetTasks = [
        ...((optimisticColumns.size > 0 ? optimisticColumns : serverTasksRef.current).get(targetColumnId) ?? []),
      ].filter((candidate) => candidate.id !== activeId);
      const overTaskIndex = currentTargetTasks.findIndex((candidate) => candidate.id === overId);
      const targetPosition =
        overData?.type === "task" && overId !== activeId && overTaskIndex >= 0
          ? overTaskIndex
          : currentTargetTasks.length;

      setDragInFlight(true);
      setIsCrossColumnDrop(true);
      setOptimisticColumns((previousColumns) => {
        const nextColumns = new Map(previousColumns.size > 0 ? previousColumns : serverTasksRef.current);

        for (const [columnId, tasks] of nextColumns) {
          nextColumns.set(
            columnId,
            tasks.filter((candidate) => candidate.id !== activeId),
          );
        }

        const targetTasks = [...(nextColumns.get(targetColumnId) ?? [])];
        const movedTask = { ...task, columnId: targetColumnId };

        if (overData?.type === "task" && overId !== activeId) {
          const overIndex = targetTasks.findIndex((candidate) => candidate.id === overId);
          targetTasks.splice(overIndex >= 0 ? overIndex : targetTasks.length, 0, movedTask);
        } else {
          targetTasks.push(movedTask);
        }

        nextColumns.set(targetColumnId, targetTasks);

        return nextColumns;
      });
      setActiveTask(null);

      void moveTask
        .mutateAsync({
          data: { columnId: targetColumnId, position: targetPosition },
          task: { ...task, columnId: targetColumnId },
          taskId: activeId,
        })
        .then(reset, reset);
    },
    [activeTask, findTaskColumnId, moveTask, optimisticColumns, reorderTask, reset],
  );

  return useMemo(
    () => ({
      activeTask,
      dragInFlight,
      getColumnTasks,
      handleDragCancel: reset,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      isCrossColumnDrop,
      overColumnId,
      registerColumnTasks,
      sensors,
    }),
    [
      activeTask,
      dragInFlight,
      getColumnTasks,
      handleDragEnd,
      handleDragOver,
      handleDragStart,
      isCrossColumnDrop,
      overColumnId,
      registerColumnTasks,
      reset,
      sensors,
    ],
  );
};
