"use client";

import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo } from "react";
import { type BoardOutput, useBoard, useBoards } from "@/entities/board";
import { useProject } from "@/entities/project";
import { CreateColumnDialog } from "@/features/create-column";
import { ProjectBoardHeaderActions } from "@/features/manage-board";
import { TaskSheet } from "@/features/manage-task";
import { Button, LoadingScreen } from "@/shared";
import { useDashboardHeader } from "@/widgets/header";
import { Kanban, KanbanColumn, useProjectKanban } from "@/widgets/kanban-board";
import { useProjectTaskLists } from "../lib";

const emptyBoards: BoardOutput[] = [];

export function ProjectBoardScreen() {
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
        <ProjectBoardHeaderActions
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
}

function BoardMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b p-3 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <p className="text-muted-foreground text-[0.68rem] uppercase">{label}</p>
      <p className="font-black text-2xl tabular-nums">{value}</p>
    </div>
  );
}
