"use client";

import { IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState, useTransition } from "react";
import z from "zod";
import { type BoardOutput, useBoard, useBoards, useCreateBoard } from "@/entities/board";
import type { ColumnOutput } from "@/entities/column";
import { useProject } from "@/entities/project";
import { taskApi, taskKeys } from "@/entities/task";
import { CreateColumnDialog } from "@/features/create-column";
import { TaskSheet } from "@/features/manage-task";
import { ProjectTabs } from "@/features/project-tabs";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  LoadingScreen,
  parseFormData,
  unwrapClientResult,
} from "@/shared";
import { useDashboardHeader } from "@/widgets/header";
import { Kanban, KanbanColumn, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  params: Promise<{ boardId: string; id: string }>;
};

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
  const { data: boards = [] } = useBoards(projectId);
  const taskLists = useProjectTaskLists(columns);
  const currentSelectedTask = taskLists.flat().find((task) => task.id === selectedTask?.id) ?? selectedTask;
  const header = useMemo(
    () => ({
      eyebrow: (
        <span className="flex items-center gap-2 text-muted-foreground text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Projects
          </Link>
          <span>/</span>
          <span className="truncate">{project?.name ?? "Project"}</span>
          <span>/</span>
          <span className="text-foreground">{board?.name ?? "Board"}</span>
        </span>
      ),
      actions: <ProjectTabs activeTab="board" boardId={boardId} projectId={projectId} />,
    }),
    [board, boardId, project, projectId],
  );

  useDashboardHeader(header);

  return (
    <Kanban.Root>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <LoadingScreen label="Loading board..." variant="shell" />
        ) : (
          <>
            <BoardBar activeBoardId={boardId} boards={boards} projectId={projectId} />
            <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
              <Kanban.Columns>
                {columns.map((column) => (
                  <KanbanColumn column={column} key={column.id} />
                ))}

                <Button
                  className="h-12 w-96 shrink-0 border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                  onClick={openCreateColumn}
                  variant="ghost"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add column
                </Button>
              </Kanban.Columns>
            </div>
          </>
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

const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(130),
});

function BoardBar({
  activeBoardId,
  boards,
  projectId,
}: {
  activeBoardId: string;
  boards: BoardOutput[];
  projectId: string;
}) {
  const createBoard = useCreateBoard(projectId);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const action = (formData: FormData) => {
    startTransition(async () => {
      setFieldErrors(null);
      setGlobalError(null);

      const parsed = parseFormData(createBoardSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      try {
        const board = await createBoard.mutateAsync(parsed.data);
        setOpen(false);
        router.push(`/projects/${projectId}/boards/${board.id}`);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to create board");
      }
    });
  };

  return (
    <div className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {boards.map((board) => (
          <Button
            key={board.id}
            size="sm"
            variant={board.id === activeBoardId ? "secondary" : "ghost"}
            render={<Link href={`/projects/${projectId}/boards/${board.id}`} />}
            className="shrink-0"
          >
            <IconLayoutKanban className="h-4 w-4" />
            <span className="max-w-44 truncate">{board.name}</span>
          </Button>
        ))}
      </div>
      <Button size="icon-sm" variant="outline" onClick={() => setOpen(true)}>
        <IconPlus className="h-4 w-4" />
        <span className="sr-only">Add board</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setFieldErrors(null);
            setGlobalError(null);
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <form action={action}>
            <DialogHeader>
              <DialogTitle>Add board</DialogTitle>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field data-invalid={!!fieldErrors?.name}>
                <FieldLabel htmlFor="boardName">Name</FieldLabel>
                <Input id="boardName" name="name" placeholder="Roadmap" disabled={pending || createBoard.isPending} />
                <FieldError>{fieldErrors?.name?.[0] ?? globalError}</FieldError>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={pending || createBoard.isPending}>
                <IconPlus className="h-4 w-4" />
                Add board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
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
