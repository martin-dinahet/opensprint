"use client";

import { IconArrowRight, IconLayoutKanban, IconPlus, IconUsersGroup } from "@tabler/icons-react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { BoardOutput } from "@/entities/board";
import { useBoards } from "@/entities/board";
import { useProjectMembers } from "@/entities/member";
import { useProject } from "@/entities/project";
import { CreateBoardDialog } from "@/features/create-board";
import { DeleteBoardDialog } from "@/features/delete-board";
import { DeleteProjectDialog } from "@/features/delete-project";
import { EditBoardDialog } from "@/features/edit-board";
import { EditProjectDialog } from "@/features/edit-project";
import { authClient } from "@/shared/lib/auth-client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";

type Props = {
  projectId: string;
};

export function ProjectOverviewPage({ projectId }: Props) {
  const session = authClient.useSession();
  const { data: project } = useProject(projectId);
  const { data: boards = [], isLoading } = useBoards(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [editBoard, setEditBoard] = useState<BoardOutput | null>(null);
  const [deleteBoard, setDeleteBoard] = useState<BoardOutput | null>(null);
  const currentRole = members.find((member) => member.userId === session.data?.user.id)?.role;
  const canManageProject = currentRole === "owner" || currentRole === "admin";
  const canDeleteProject = currentRole === "owner";
  const canManageBoards = canManageProject;

  return (
    <>
      <AppShellHeader
        title={project?.name ?? "Project"}
        breadcrumbs={[{ href: "/dashboard", label: "Projects" }, { label: project?.name ?? "Project" }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/members`}
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-muted-foreground text-sm outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <IconUsersGroup className="h-3.5 w-3.5" />
              Members
            </Link>
            <Button size="sm" onClick={() => setCreateBoardOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Board
            </Button>
            {(canManageProject || canDeleteProject) && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <MoreHorizontalIcon />
                  <span className="sr-only">Project actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canManageProject && (
                    <DropdownMenuItem onClick={() => setEditProjectOpen(true)}>
                      <PencilIcon />
                      Edit project
                    </DropdownMenuItem>
                  )}
                  {canDeleteProject && (
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteProjectOpen(true)}>
                      <Trash2Icon />
                      Delete project
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">Boards</h3>
                <p className="text-muted-foreground text-sm">
                  {project?.description ?? "Kanban spaces inside this project."}
                </p>
              </div>
              <Badge variant="outline">{boards.length} total</Badge>
            </div>

            {isLoading ? (
              <LoadingScreen label="Loading boards..." variant="shell" />
            ) : !boards.length ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
                <IconLayoutKanban className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-center text-muted-foreground">No boards yet</p>
                <Button className="mt-4" onClick={() => setCreateBoardOpen(true)}>
                  Create first board
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {boards.map((board) => (
                  <Card
                    key={board.id}
                    className="group relative rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/35"
                  >
                    <Link
                      href={`/projects/${projectId}/boards/${board.id}`}
                      className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <CardHeader className="pb-3 pr-12">
                        <div className="flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-primary">
                            <IconLayoutKanban className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="truncate font-semibold text-base">{board.name}</CardTitle>
                                <p className="mt-1 text-muted-foreground text-xs">Board {board.position + 1}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-muted-foreground text-sm">
                                <span className="hidden sm:inline">Open board</span>
                                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                            {board.description && (
                              <CardDescription className="mt-3 line-clamp-2">{board.description}</CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Link>
                    {canManageBoards && (
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <MoreHorizontalIcon />
                            <span className="sr-only">Board actions</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditBoard(board)}>
                              <PencilIcon />
                              Edit board
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteBoard(board)}>
                              <Trash2Icon />
                              Delete board
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <CreateBoardDialog open={createBoardOpen} onOpenChange={setCreateBoardOpen} projectId={projectId} />
      {project && (
        <>
          <EditProjectDialog open={editProjectOpen} onOpenChange={setEditProjectOpen} project={project} />
          <DeleteProjectDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen} project={project} />
        </>
      )}
      {editBoard && (
        <EditBoardDialog open={!!editBoard} onOpenChange={(open) => !open && setEditBoard(null)} board={editBoard} />
      )}
      {deleteBoard && (
        <DeleteBoardDialog
          open={!!deleteBoard}
          onOpenChange={(open) => !open && setDeleteBoard(null)}
          board={deleteBoard}
        />
      )}
    </>
  );
}
