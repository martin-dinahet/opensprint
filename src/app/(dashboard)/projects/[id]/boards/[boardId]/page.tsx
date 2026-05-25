"use client";

import { IconChevronDown, IconDotsVertical, IconEdit, IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState, useTransition } from "react";
import z from "zod";
import { type BoardOutput, useBoard, useBoards, useCreateBoard, useUpdateBoard } from "@/entities/board";
import type { ColumnOutput } from "@/entities/column";
import { useProject } from "@/entities/project";
import { taskApi, taskKeys } from "@/entities/task";
import { CreateColumnDialog } from "@/features/create-column";
import { TaskSheet } from "@/features/manage-task";
import { ProjectTabs } from "@/features/project-tabs";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  LoadingScreen,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  parseFormData,
  unwrapClientResult,
} from "@/shared";
import { useDashboardHeader } from "@/widgets/header";
import { Kanban, KanbanColumn, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  params: Promise<{ boardId: string; id: string }>;
};

const emptyBoards: BoardOutput[] = [];

export default function BoardPage({ params }: Props) {
  const { boardId, id: projectId } = use(params);

  return (
    <ProjectKanbanProvider boardId={boardId} projectId={projectId}>
      <ProjectKanbanContent />
    </ProjectKanbanProvider>
  );
}

const ProjectKanbanContent = () => {
  const {
    activeColumnId,
    boardId,
    columns,
    createColumnOpen,
    createTaskOpen,
    isLoading,
    members,
    openCreateColumn,
    projectId,
    selectedTask,
    setCreateColumnOpen,
    setCreateTaskOpen,
    setSelectedTask,
  } = useProjectKanban();
  const { data: project } = useProject(projectId);
  const { data: board } = useBoard(projectId, boardId);
  const { data: boards = emptyBoards } = useBoards(projectId);
  const taskLists = useProjectTaskLists(columns);
  const currentSelectedTask = taskLists.flat().find((task) => task.id === selectedTask?.id) ?? selectedTask;
  const boardStats = useMemo(() => {
    const tasks = taskLists.flat();
    return {
      assigned: tasks.filter((task) => task.assigneeId).length,
      blocked: columns.filter(
        (column) => column.wipLimit && (taskLists[columns.indexOf(column)]?.length ?? 0) > column.wipLimit,
      ).length,
      columns: columns.length,
      tasks: tasks.length,
    };
  }, [columns, taskLists]);
  const header = useMemo(
    () => ({
      title: board?.name ?? "Board",
      eyebrow: (
        <span className="flex items-center gap-2 text-muted-foreground text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Projects
          </Link>
          <span>/</span>
          <span className="truncate">{project?.name ?? "Project"}</span>
        </span>
      ),
      actions: (
        <ProjectHeaderActions
          activeBoardId={boardId}
          activeBoardName={board?.name ?? "Board"}
          boards={boards}
          projectId={projectId}
        />
      ),
    }),
    [board, boardId, boards, project, projectId],
  );

  useDashboardHeader(header);

  return (
    <Kanban.Root>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <LoadingScreen label="Loading board…" variant="shell" />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid border-b-2 bg-card sm:grid-cols-4">
              <BoardMetric label="Columns" value={boardStats.columns} />
              <BoardMetric label="Open tasks" value={boardStats.tasks} />
              <BoardMetric label="Assigned" value={boardStats.assigned} />
              <BoardMetric label="WIP alerts" value={boardStats.blocked} />
            </div>
            <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
              <Kanban.Columns>
                {columns.map((column) => (
                  <KanbanColumn column={column} key={column.id} />
                ))}

                <Button
                  className="h-10 w-80 shrink-0 border border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                  onClick={openCreateColumn}
                  variant="ghost"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Column
                </Button>
              </Kanban.Columns>
            </div>
          </div>
        )}
      </main>

      <CreateColumnDialog
        boardId={boardId}
        onOpenChange={setCreateColumnOpen}
        open={createColumnOpen}
        projectId={projectId}
      />

      <TaskSheet
        columnId={activeColumnId}
        members={members}
        onCreated={() => {
          setCreateTaskOpen(false);
          setSelectedTask(null);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setCreateTaskOpen(false);
          }
        }}
        open={createTaskOpen || !!selectedTask}
        projectId={projectId}
        task={currentSelectedTask}
      />
    </Kanban.Root>
  );
};

function BoardMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b p-3 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <p className="text-muted-foreground text-[0.68rem] uppercase">{label}</p>
      <p className="font-black text-2xl tabular-nums">{value}</p>
    </div>
  );
}

const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(130),
});

function ProjectHeaderActions({
  activeBoardId,
  activeBoardName,
  boards,
  projectId,
}: {
  activeBoardId: string;
  activeBoardName: string;
  boards: BoardOutput[];
  projectId: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ProjectTabs activeTab="board" boardId={activeBoardId} projectId={projectId} />
      <BoardActions
        activeBoardId={activeBoardId}
        activeBoardName={activeBoardName}
        boards={boards}
        projectId={projectId}
      />
    </div>
  );
}

function BoardActions({
  activeBoardId,
  activeBoardName,
  boards,
  projectId,
}: {
  activeBoardId: string;
  activeBoardName: string;
  boards: BoardOutput[];
  projectId: string;
}) {
  const createBoard = useCreateBoard(projectId);
  const updateBoard = useUpdateBoard(projectId);
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const resetErrors = () => {
    setFieldErrors(null);
    setGlobalError(null);
  };

  const addBoard = (formData: FormData) => {
    startTransition(async () => {
      resetErrors();

      const parsed = parseFormData(createBoardSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      try {
        const board = await createBoard.mutateAsync(parsed.data);
        setAddOpen(false);
        router.push(`/projects/${projectId}/boards/${board.id}`);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to create board");
      }
    });
  };

  const renameBoard = (formData: FormData) => {
    startTransition(async () => {
      resetErrors();

      const parsed = parseFormData(createBoardSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      try {
        await updateBoard.mutateAsync({ boardId: activeBoardId, data: parsed.data });
        setRenameOpen(false);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to rename board");
      }
    });
  };

  return (
    <>
      <BoardSwitcher
        activeBoardId={activeBoardId}
        activeBoardName={activeBoardName}
        boards={boards}
        onAddBoard={() => setAddOpen(true)}
        projectId={projectId}
      />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button aria-label="Board actions" variant="outline" size="icon-sm" />}>
          <IconDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Board actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <IconEdit />
              Rename Board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddOpen(true)}>
              <IconPlus />
              Add Board
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={addOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetErrors();
          setAddOpen(nextOpen);
        }}
      >
        <DialogContent>
          <form action={addBoard}>
            <DialogHeader>
              <DialogTitle>Add Board</DialogTitle>
              <DialogDescription>Create another board in this project.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field data-invalid={!!fieldErrors?.name}>
                <FieldLabel htmlFor="boardName">Name</FieldLabel>
                <Input
                  id="boardName"
                  name="name"
                  placeholder="Roadmap…"
                  autoComplete="off"
                  disabled={pending || createBoard.isPending}
                />
                <FieldError>{fieldErrors?.name?.[0] ?? globalError}</FieldError>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={pending || createBoard.isPending}>
                <IconPlus className="h-4 w-4" />
                Add Board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetErrors();
          setRenameOpen(nextOpen);
        }}
      >
        <DialogContent>
          <form action={renameBoard}>
            <DialogHeader>
              <DialogTitle>Rename Board</DialogTitle>
              <DialogDescription>Update the board name shown in this project.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field data-invalid={!!fieldErrors?.name}>
                <FieldLabel htmlFor="renameBoardName">Name</FieldLabel>
                <Input
                  id="renameBoardName"
                  name="name"
                  defaultValue={activeBoardName}
                  autoComplete="off"
                  disabled={pending || updateBoard.isPending}
                />
                <FieldError>{fieldErrors?.name?.[0] ?? globalError}</FieldError>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={pending || updateBoard.isPending}>
                <IconEdit className="h-4 w-4" />
                Rename Board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BoardSwitcher({
  activeBoardId,
  activeBoardName,
  boards,
  onAddBoard,
  projectId,
}: {
  activeBoardId: string;
  activeBoardName: string;
  boards: BoardOutput[];
  onAddBoard: () => void;
  projectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boardCount = boards.length || 1;

  const switchBoard = (boardId: string) => {
    setOpen(false);
    if (boardId !== activeBoardId) {
      router.push(`/projects/${projectId}/boards/${boardId}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button className="max-w-[13rem] justify-start gap-2 px-2 sm:max-w-[18rem]" size="sm" variant="outline" />
        }
      >
        <IconLayoutKanban className="size-3.5 text-muted-foreground" />
        <span className="min-w-0 truncate">{activeBoardName}</span>
        <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground tabular-nums">
          {boardCount}
        </span>
        <IconChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] gap-2 p-2">
        <PopoverHeader className="px-2 pt-1">
          <PopoverTitle>Boards</PopoverTitle>
        </PopoverHeader>
        <Command>
          <CommandInput placeholder="Find a board..." />
          <CommandList>
            <CommandEmpty>No boards found.</CommandEmpty>
            <CommandGroup>
              {boards.map((board) => (
                <CommandItem
                  data-checked={board.id === activeBoardId}
                  key={board.id}
                  onSelect={() => switchBoard(board.id)}
                  value={board.name}
                >
                  <IconLayoutKanban className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{board.name}</span>
                  {board.id === activeBoardId ? <span className="text-muted-foreground text-xs">Current</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddBoard();
                }}
                value="add board"
              >
                <IconPlus className="size-4 text-muted-foreground" />
                <span>Add board</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useProjectTaskLists(columns: ColumnOutput[]) {
  const taskQueries = useQueries({
    queries: columns.map((column) => ({
      queryKey: taskKeys.list(column.id),
      queryFn: async () => unwrapClientResult(await taskApi.list(column.id)).tasks,
      enabled: !!column.id,
    })),
  });

  return taskQueries.map((query) => query.data ?? []);
}
