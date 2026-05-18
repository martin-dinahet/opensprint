"use client";

import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconCheck,
  IconFlag,
  IconListCheck,
  IconPlus,
  IconTag,
  IconTrash,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MemberWithUserOutput } from "@/entities/member";
import {
  type ProjectTaskTagOutput,
  type TaskItemOutput,
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
  useProjectTaskTags,
  useReorderTaskItems,
  useUpdateTask,
  useUpdateTaskItem,
} from "@/entities/task";
import { handleClientResult } from "@/shared";
import { cn } from "@/shared";
import { Alert, AlertDescription } from "@/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared";
import { Badge } from "@/shared";
import { Button } from "@/shared";
import { Input } from "@/shared";
import { Label } from "@/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared";
import { Separator } from "@/shared";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared";
import { Textarea } from "@/shared";

type DraftItem = {
  id: string;
  title: string;
};

type Props = {
  columnId?: string;
  members: MemberWithUserOutput[];
  onCreated?: (task: TaskOutput) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
  task: TaskOutput | null;
};

const tagPalette = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];

const priorityItems = {
  high: "High",
  low: "Low",
  medium: "Medium",
  urgent: "Urgent",
};

const getMemberLabel = (member: MemberWithUserOutput) => member.user.name || member.user.email;

const toDateInputValue = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const moveArrayItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;

  const nextItems = [...items];
  const [item] = nextItems.splice(index, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
};

export const TaskSheet = ({ columnId = "", members, onCreated, onOpenChange, open, projectId, task }: Props) => {
  const isCreateMode = !task;
  const { data: projectTags = [] } = useProjectTaskTags(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const assignTask = useAssignTask();
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
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(tagPalette[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setAssigneeId(task?.assigneeId ?? null);
    setDueDate(toDateInputValue(task?.dueDate ?? null));
    setDraftItems([]);
    setSelectedTagIds(new Set(task?.tags.map((tag) => tag.id) ?? []));
    setNewItemTitle("");
    setNewTagName("");
    setError(null);
  }, [open, task]);

  const items = task?.items ?? [];
  const doneCount = items.filter((item) => item.done).length;
  const completion = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const attachedTagIds = useMemo(() => new Set(task?.tags.map((tag) => tag.id) ?? []), [task?.tags]);
  const selectedTags = projectTags.filter((tag) => selectedTagIds.has(tag.id));
  const pending =
    createTask.isPending ||
    updateTask.isPending ||
    assignTask.isPending ||
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
              items: draftItems
                .map((item) => item.title.trim())
                .filter(Boolean)
                .map((title) => ({ title })),
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

  const updateDraftItem = (itemId: string, title: string) => {
    setDraftItems((items) => items.map((item) => (item.id === itemId ? { ...item, title } : item)));
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

  const renderTagButton = (tag: ProjectTaskTagOutput) => {
    const selected = isCreateMode ? selectedTagIds.has(tag.id) : attachedTagIds.has(tag.id);

    return (
      <span
        key={tag.id}
        className={cn(
          "group inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
          selected
            ? "border-primary/30 bg-primary/10 text-foreground font-medium shadow-xs"
            : "border-border text-muted-foreground hover:border-muted-foreground/30",
        )}
      >
        <button
          type="button"
          aria-label={tag.name}
          className="inline-flex min-w-0 flex-1 items-center gap-1.5"
          onClick={() => toggleTag(tag.id)}
        >
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
          <span className="truncate">{tag.name}</span>
        </button>
        <button
          type="button"
          className="ml-0.5 inline-flex size-3.5 cursor-pointer items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground"
          onClick={() => deleteTag.mutate({ projectId, tagId: tag.id })}
        >
          <IconX className="h-2.5 w-2.5" />
          <span className="sr-only">Delete tag</span>
        </button>
      </span>
    );
  };

  const renderPersistedItem = (item: TaskItemOutput, index: number) => {
    if (!task) return null;

    return (
      <div key={item.id} className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
        <input
          type="checkbox"
          checked={item.done}
          className="size-4 shrink-0 accent-primary"
          onChange={(event) =>
            updateItem.mutate({
              columnId: task.columnId,
              done: event.target.checked,
              itemId: item.id,
              taskId: task.id,
            })
          }
        />
        <Input
          defaultValue={item.title}
          className={cn("h-7 flex-1 border-0 bg-transparent px-1", item.done && "text-muted-foreground line-through")}
          onBlur={(event) =>
            updateItem.mutate({
              columnId: task.columnId,
              itemId: item.id,
              taskId: task.id,
              title: event.target.value,
            })
          }
        />
        <ItemActions
          canMoveDown={index < task.items.length - 1}
          canMoveUp={index > 0}
          onDelete={() => deleteItem.mutate({ columnId: task.columnId, itemId: item.id, taskId: task.id })}
          onMoveDown={() => movePersistedItem(item.id, 1)}
          onMoveUp={() => movePersistedItem(item.id, -1)}
        />
      </div>
    );
  };

  const renderDraftItem = (item: DraftItem, index: number) => (
    <div key={item.id} className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
      <span className="size-4 shrink-0 rounded border border-dashed border-muted-foreground/50" />
      <Input
        value={item.title}
        className="h-7 flex-1 border-0 bg-transparent px-1"
        onChange={(event) => updateDraftItem(item.id, event.target.value)}
      />
      <ItemActions
        canMoveDown={index < draftItems.length - 1}
        canMoveUp={index > 0}
        onDelete={() => deleteDraftItem(item.id)}
        onMoveDown={() => moveDraftItem(item.id, 1)}
        onMoveUp={() => moveDraftItem(item.id, -1)}
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-[min(100vw,36rem)] gap-0 overflow-hidden sm:!max-w-xl" showCloseButton>
        <SheetHeader className="border-b px-4 py-3 pr-12">
          <SheetTitle>{isCreateMode ? "Create task" : "Task details"}</SheetTitle>
          <SheetDescription>
            {isCreateMode
              ? "Add the core details, tags, and checklist in one pass."
              : "Edit the task details, tags, and checklist."}
          </SheetDescription>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={createOrUpdateTask}>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-4">
              <section className="space-y-2">
                <Label htmlFor="task-sheet-title">Title</Label>
                <Input id="task-sheet-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </section>

              <section className="grid gap-3 rounded-md border bg-muted/10 p-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="task-sheet-priority" className="text-xs">
                    Priority
                  </Label>
                  <Select
                    items={priorityItems}
                    value={priority}
                    onValueChange={(value) => setPriority(value as TaskPriority)}
                  >
                    <SelectTrigger id="task-sheet-priority" className="h-9 w-full">
                      <IconFlag />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Assignee</Label>
                  <Select
                    items={[
                      { label: "Unassigned", value: null },
                      ...members.map((member) => ({ label: getMemberLabel(member), value: member.id })),
                    ]}
                    value={assigneeId}
                    onValueChange={(value) => setAssigneeId(typeof value === "string" ? value : null)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <IconUser />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <span className="flex items-center gap-2">
                            <Avatar size="sm">
                              {member.user.image ? <AvatarImage alt="" src={member.user.image} /> : null}
                              <AvatarFallback>{getMemberLabel(member).trim().charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {getMemberLabel(member)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-sheet-due-date" className="text-xs">
                    Due date
                  </Label>
                  <div className="relative">
                    <IconCalendar className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="task-sheet-due-date"
                      className="h-9 pl-8"
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <Label htmlFor="task-sheet-description">Description</Label>
                <Textarea
                  id="task-sheet-description"
                  className="min-h-28 whitespace-pre-wrap"
                  placeholder="Add notes, acceptance criteria, or links"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </section>

              <section className="space-y-3 rounded-md border bg-muted/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-medium text-sm">
                      <IconTag className="h-4 w-4 text-muted-foreground" />
                      Tags
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {isCreateMode && selectedTags.length > 0
                        ? `${selectedTags.length} selected`
                        : "Reusable project labels"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">{projectTags.map(renderTagButton)}</div>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Input
                    placeholder="New tag"
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addTag();
                      }
                    }}
                  />
                  <div className="flex items-center gap-1 rounded-md border px-2 py-1">
                    {tagPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn("size-4 rounded-full ring-offset-2", newTagColor === color && "ring-2 ring-ring")}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      >
                        <span className="sr-only">Choose tag color</span>
                      </button>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={addTag} disabled={!newTagName.trim()}>
                    <IconPlus className="h-4 w-4" />
                    Tag
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-md border bg-muted/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-medium text-sm">
                      <IconListCheck className="h-4 w-4 text-muted-foreground" />
                      Checklist
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {isCreateMode
                        ? `${draftItems.length} draft item${draftItems.length === 1 ? "" : "s"}`
                        : items.length > 0
                          ? `${doneCount}/${items.length} complete`
                          : "No items"}
                    </p>
                  </div>
                  {!isCreateMode ? <Badge variant="outline">{completion}%</Badge> : null}
                </div>

                <div className="space-y-2">
                  {isCreateMode ? draftItems.map(renderDraftItem) : items.map(renderPersistedItem)}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item"
                    value={newItemTitle}
                    onChange={(event) => setNewItemTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addItem();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addItem} disabled={!newItemTitle.trim()}>
                    <IconPlus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </section>
            </div>
          </div>

          <Separator />

          <SheetFooter className="border-t bg-popover">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isCreateMode ? "Cancel" : "Close"}
              </Button>
              <Button type="submit" disabled={pending || title.trim().length === 0}>
                {isCreateMode ? <IconPlus className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
                {isCreateMode ? "Create task" : "Save changes"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

function ItemActions({
  canMoveDown,
  canMoveUp,
  onDelete,
  onMoveDown,
  onMoveUp,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <Button type="button" size="icon-sm" variant="ghost" disabled={!canMoveUp} onClick={onMoveUp}>
        <IconArrowUp className="h-3.5 w-3.5" />
        <span className="sr-only">Move item up</span>
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" disabled={!canMoveDown} onClick={onMoveDown}>
        <IconArrowDown className="h-3.5 w-3.5" />
        <span className="sr-only">Move item down</span>
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" onClick={onDelete}>
        <IconTrash className="h-3.5 w-3.5" />
        <span className="sr-only">Delete item</span>
      </Button>
    </span>
  );
}
