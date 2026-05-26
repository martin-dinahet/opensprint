"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBoards } from "@/entities/board";
import { useColumns } from "@/entities/column";
import type { MemberWithUserOutput } from "@/entities/member";
import { useProjects } from "@/entities/project";
import {
  type ProjectTaskTagOutput,
  type TaskItemOutput,
  type TaskKind,
  type TaskOutput,
  type TaskPriority,
  useAssignTask,
  useAttachTaskTag,
  useCreateProjectTaskTag,
  useCreateTask,
  useCreateTaskItem,
  useDeleteProjectTaskTag,
  useDeleteTaskItem,
  useDetachTaskTag,
  useMoveTask,
  useProjectTaskTags,
  useReorderTaskItems,
  useTransferTask,
  useUpdateTask,
  useUpdateTaskItem,
} from "@/entities/task";
import { taskTagPalette, toDateInputValue } from "@/entities/task/lib";
import { handleClientResult, moveArrayItem } from "@/shared";

export type DraftItem = {
  id: string;
  title: string;
};

type Options = {
  columnId?: string;
  members: MemberWithUserOutput[];
  onCreated?: (task: TaskOutput) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
  task: TaskOutput | null;
};

export function useTaskSheetController({ columnId = "", onCreated, onOpenChange, open, projectId, task }: Options) {
  const isCreateMode = !task;
  const { data: projectTags = [] } = useProjectTaskTags(projectId);
  const { data: projects = [] } = useProjects();
  const [targetProjectId, setTargetProjectId] = useState("");
  const [targetBoardId, setTargetBoardId] = useState("");
  const [targetColumnId, setTargetColumnId] = useState("");
  const { data: targetBoards = [] } = useBoards(targetProjectId);
  const { data: targetColumns = [] } = useColumns(targetProjectId, targetBoardId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const assignTask = useAssignTask();
  const moveTask = useMoveTask();
  const transferTask = useTransferTask();
  const createItem = useCreateTaskItem();
  const updateItem = useUpdateTaskItem();
  const deleteItem = useDeleteTaskItem();
  const reorderItems = useReorderTaskItems();
  const createTag = useCreateProjectTaskTag();
  const deleteTag = useDeleteProjectTaskTag();
  const attachTag = useAttachTaskTag();
  const detachTag = useDetachTaskTag();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [kind, setKind] = useState<TaskKind>("task");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(taskTagPalette[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setKind(task?.kind ?? "task");
    setEstimate(task?.estimate ?? null);
    setAssigneeId(task?.assigneeId ?? null);
    setDueDate(toDateInputValue(task?.dueDate ?? null));
    setDraftItems([]);
    setSelectedTagIds(new Set(task?.tags.map((tag) => tag.id) ?? []));
    setNewItemTitle("");
    setNewTagName("");
    setTargetProjectId(projectId);
    setTargetBoardId("");
    setTargetColumnId("");
    setError(null);
  }, [open, projectId, task]);

  const transferTargetProjects = useMemo(
    () => [...projects].sort((a, b) => (a.id === projectId ? -1 : b.id === projectId ? 1 : 0)),
    [projectId, projects],
  );
  const items = task?.items ?? [];
  const doneCount = items.filter((item) => item.done).length;
  const completion = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const attachedTagIds = useMemo(() => new Set(task?.tags.map((tag) => tag.id) ?? []), [task?.tags]);
  const selectedTags = projectTags.filter((tag) => selectedTagIds.has(tag.id));
  const pending =
    createTask.isPending ||
    updateTask.isPending ||
    assignTask.isPending ||
    moveTask.isPending ||
    transferTask.isPending ||
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending ||
    reorderItems.isPending ||
    createTag.isPending ||
    attachTag.isPending ||
    detachTag.isPending;

  const createOrUpdateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isCreateMode) {
      if (!columnId) {
        setError("Choose a column before creating a task.");
        return;
      }

      const result = await handleClientResult(
        () =>
          createTask.mutateAsync({
            columnId,
            data: {
              assigneeId: assigneeId ?? undefined,
              description: description.trim() ? description : undefined,
              dueDate: dueDate || undefined,
              estimate,
              items: draftItems
                .map((item) => item.title.trim())
                .filter(Boolean)
                .map((title) => ({ title })),
              kind,
              priority,
              tagIds: [...selectedTagIds],
              title: title.trim(),
            },
          }),
        "Unable to create task",
      );

      result.match({
        ok: (createdTask) => {
          toast.success("Task created");
          onCreated?.(createdTask);
          onOpenChange(false);
        },
        err: (error) => {
          setError(error.message);
          toast.error(error.message);
        },
      });
      return;
    }

    if (!task) return;

    const result = await handleClientResult(
      () =>
        updateTask
          .mutateAsync({
            columnId: task.columnId,
            data: {
              description: description.trim() ? description : null,
              dueDate: dueDate || null,
              estimate,
              kind,
              priority,
              title: title.trim(),
            },
            taskId: task.id,
          })
          .then(async (updatedTask) => {
            if (assigneeId !== task.assigneeId) {
              await assignTask.mutateAsync({ assigneeId, taskId: task.id });
            }
            return updatedTask;
          }),
      "Unable to save task",
    );

    result.match({
      ok: () => {
        toast.success("Task saved");
        onOpenChange(false);
      },
      err: (error) => {
        setError(error.message);
        toast.error(error.message);
      },
    });
  };

  const addItem = async () => {
    const itemTitle = newItemTitle.trim();
    if (!itemTitle) return;

    if (isCreateMode) {
      setDraftItems((items) => [...items, { id: crypto.randomUUID(), title: itemTitle }]);
      setNewItemTitle("");
      return;
    }

    if (!task) return;
    setError(null);

    const result = await handleClientResult(
      () => createItem.mutateAsync({ columnId: task.columnId, taskId: task.id, title: itemTitle }),
      "Unable to add checklist item",
    );

    result.match({
      ok: () => setNewItemTitle(""),
      err: (error) => setError(error.message),
    });
  };

  const transferCurrentTask = async () => {
    if (!task || !targetColumnId) return;
    setError(null);

    const mutation =
      targetProjectId === projectId
        ? () => moveTask.mutateAsync({ taskId: task.id, data: { columnId: targetColumnId } })
        : () => transferTask.mutateAsync({ taskId: task.id, data: { columnId: targetColumnId } });

    const result = await handleClientResult(mutation, "Unable to transfer task");

    result.match({
      ok: () => {
        toast.success("Task transferred");
        onOpenChange(false);
      },
      err: (error) => {
        setError(error.message);
        toast.error(error.message);
      },
    });
  };

  const updateDraftItem = (itemId: string, nextTitle: string) => {
    setDraftItems((items) => items.map((item) => (item.id === itemId ? { ...item, title: nextTitle } : item)));
  };

  const deleteDraftItem = (itemId: string) => {
    setDraftItems((items) => items.filter((item) => item.id !== itemId));
  };

  const moveDraftItem = (itemId: string, direction: -1 | 1) => {
    setDraftItems((items) =>
      moveArrayItem(
        items,
        items.findIndex((item) => item.id === itemId),
        direction,
      ),
    );
  };

  const movePersistedItem = async (itemId: string, direction: -1 | 1) => {
    if (!task) return;
    const index = task.items.findIndex((item) => item.id === itemId);
    const nextItems = moveArrayItem(task.items, index, direction);
    if (nextItems === task.items) return;
    await reorderItems.mutateAsync({
      columnId: task.columnId,
      itemIds: nextItems.map((item) => item.id),
      taskId: task.id,
    });
  };

  const updatePersistedItem = (itemId: string, data: Partial<Pick<TaskItemOutput, "done" | "title">>) => {
    if (!task) return;
    updateItem.mutate({
      columnId: task.columnId,
      itemId,
      taskId: task.id,
      ...data,
    });
  };

  const deletePersistedItem = (itemId: string) => {
    if (!task) return;
    deleteItem.mutate({ columnId: task.columnId, itemId, taskId: task.id });
  };

  const toggleTag = async (tagId: string) => {
    if (isCreateMode) {
      setSelectedTagIds((tagIds) => {
        const nextTagIds = new Set(tagIds);
        if (nextTagIds.has(tagId)) nextTagIds.delete(tagId);
        else nextTagIds.add(tagId);
        return nextTagIds;
      });
      return;
    }

    if (!task) return;
    if (attachedTagIds.has(tagId)) {
      await detachTag.mutateAsync({ columnId: task.columnId, tagId, taskId: task.id });
      return;
    }
    await attachTag.mutateAsync({ columnId: task.columnId, tagId, taskId: task.id });
  };

  const addTag = async () => {
    if (!newTagName.trim()) return;
    setError(null);
    const result = await handleClientResult(async () => {
      const tag = await createTag.mutateAsync({
        data: { color: newTagColor, name: newTagName.trim() },
        projectId,
      });

      if (isCreateMode) {
        setSelectedTagIds((tagIds) => new Set(tagIds).add(tag.id));
        return;
      }

      if (task) {
        await attachTag.mutateAsync({ columnId: task.columnId, tagId: tag.id, taskId: task.id });
      }
    }, "Unable to create task tag");

    result.match({
      ok: () => setNewTagName(""),
      err: (error) => setError(error.message),
    });
  };

  const deleteProjectTag = (tag: ProjectTaskTagOutput) => {
    deleteTag.mutate({ projectId, tagId: tag.id });
  };

  return {
    addItem,
    addTag,
    assigneeId,
    attachedTagIds,
    completion,
    createOrUpdateTask,
    deleteDraftItem,
    deletePersistedItem,
    deleteProjectTag,
    description,
    doneCount,
    draftItems,
    dueDate,
    error,
    estimate,
    isCreateMode,
    items,
    kind,
    moveDraftItem,
    movePersistedItem,
    newItemTitle,
    newTagColor,
    newTagName,
    pending,
    priority,
    projectTags,
    selectedTagIds,
    selectedTags,
    setAssigneeId,
    setDescription,
    setDueDate,
    setEstimate,
    setKind,
    setNewItemTitle,
    setNewTagColor,
    setNewTagName,
    setPriority,
    setTargetBoardId,
    setTargetColumnId,
    setTargetProjectId,
    setTitle,
    targetBoardId,
    targetBoards,
    targetColumnId,
    targetColumns,
    targetProjectId,
    title,
    toggleTag,
    transferCurrentTask,
    transferTargetProjects,
    updateDraftItem,
    updatePersistedItem,
  };
}
