"use client";

import { IconPlus, IconUsersGroup } from "@tabler/icons-react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useBoard, useBoards } from "@/entities/board";
import { useProjectMembers } from "@/entities/member";
import { useProject } from "@/entities/project";
import { CreateColumnDialog } from "@/features/create-column";
import { CreateTaskDialog } from "@/features/create-task";
import { DeleteBoardDialog } from "@/features/delete-board";
import { EditBoardDialog } from "@/features/edit-board";
import { EditTaskDialog } from "@/features/edit-task";
import { TaskDetailDialog } from "@/features/view-task";
import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";
import { BoardColumn, Kanban, ProjectKanbanProvider, useProjectKanban } from "@/widgets/kanban-board";

type Props = {
  boardId?: string;
  projectId: string;
};

export const ProjectKanbanPage = ({ boardId, projectId }: Props) => {
  const { data: boards = [], isLoading } = useBoards(projectId);
  const activeBoardId = boardId ?? boards[0]?.id ?? "";

  if (isLoading && !activeBoardId) {
    return <LoadingScreen label="Loading board..." variant="shell" />;
  }

  return (
    <ProjectKanbanProvider boardId={activeBoardId} projectId={projectId}>
      <ProjectKanbanContent />
    </ProjectKanbanProvider>
  );
};

const ProjectKanbanContent = () => {
  const {
    activeColumnId,
    boardId,
    columns,
    createColumnOpen,
    createTaskOpen,
    editTask,
    isLoading,
    members,
    openCreateColumn,
    projectId,
    setCreateColumnOpen,
    setCreateTaskOpen,
    setEditTask,
    setViewTask,
    viewTask,
  } = useProjectKanban();
  const session = authClient.useSession();
  const { data: board } = useBoard(projectId, boardId);
  const { data: project } = useProject(projectId);
  const { data: projectMembers = [] } = useProjectMembers(projectId);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const currentRole = projectMembers.find((member) => member.userId === session.data?.user.id)?.role;
  const canManageBoard = currentRole === "owner" || currentRole === "admin";

  return (
    <Kanban.Root>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader
          title={board?.name ?? "Board"}
          breadcrumbs={[
            { href: "/dashboard", label: "Projects" },
            { href: `/projects/${projectId}`, label: project?.name ?? "Project" },
            { label: board?.name ?? "Board" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href={`/projects/${projectId}/members`}
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-muted-foreground text-sm outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <IconUsersGroup className="h-3.5 w-3.5" />
                Members
              </Link>
              {board && canManageBoard && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontalIcon />
                    <span className="sr-only">Board actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditBoardOpen(true)}>
                      <PencilIcon />
                      Edit board
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteBoardOpen(true)}>
                      <Trash2Icon />
                      Delete board
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />

        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <LoadingScreen label="Loading board..." variant="shell" />
          ) : (
            <Kanban.Columns>
              {columns?.map((column) => (
                <BoardColumn column={column} key={column.id} />
              ))}

              <Button
                className="h-12 w-72 shrink-0 border-2 border-dashed border-border hover:border-solid"
                onClick={openCreateColumn}
                variant="ghost"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </Kanban.Columns>
          )}
        </main>
      </div>

      <CreateColumnDialog boardId={boardId} onOpenChange={setCreateColumnOpen} open={createColumnOpen} />

      <CreateTaskDialog
        columnId={activeColumnId}
        members={members}
        onOpenChange={setCreateTaskOpen}
        open={createTaskOpen}
      />

      <EditTaskDialog
        members={members}
        onOpenChange={(open) => !open && setEditTask(null)}
        open={!!editTask}
        task={editTask}
      />

      <TaskDetailDialog
        members={members}
        onOpenChange={(open) => !open && setViewTask(null)}
        open={!!viewTask}
        task={viewTask}
      />

      {board && (
        <>
          <EditBoardDialog open={editBoardOpen} onOpenChange={setEditBoardOpen} board={board} />
          <DeleteBoardDialog open={deleteBoardOpen} onOpenChange={setDeleteBoardOpen} board={board} redirectToProject />
        </>
      )}
    </Kanban.Root>
  );
};
