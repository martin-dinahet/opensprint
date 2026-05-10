"use client";

import { IconArrowRight, IconLayoutKanban, IconPlus, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useBoards } from "@/entities/board";
import { useProject } from "@/entities/project";
import { CreateBoardDialog } from "@/features/create-board";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";

type Props = {
  projectId: string;
};

export function ProjectOverviewPage({ projectId }: Props) {
  const { data: project } = useProject(projectId);
  const { data: boards = [], isLoading } = useBoards(projectId);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

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
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="border-b bg-muted/20 px-6 py-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-muted-foreground text-xs uppercase">Project hub</p>
              <h2 className="mt-2 truncate font-semibold text-2xl">{project?.name ?? "Project"}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
                {project?.description ?? "Boards, members, and project-level work live here."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/projects/${projectId}/members`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-medium text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <IconUsersGroup className="h-4 w-4" />
                Members
              </Link>
              <Button onClick={() => setCreateBoardOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                New Board
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg">Boards</h3>
                <p className="text-muted-foreground text-sm">Kanban spaces inside this project.</p>
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
                  <Link
                    key={board.id}
                    href={`/projects/${projectId}/boards/${board.id}`}
                    className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Card className="group rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/35">
                      <CardHeader className="pb-3">
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
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Project areas</h3>
              <p className="text-muted-foreground text-sm">Shared project spaces.</p>
            </div>
            <div className="space-y-2">
              <Link
                href={`/projects/${projectId}`}
                className="flex items-center justify-between rounded-lg border bg-muted/35 px-3 py-3 font-medium text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-current="page"
              >
                <span className="flex items-center gap-2">
                  <IconLayoutKanban className="h-4 w-4 text-primary" />
                  Boards
                </span>
                <Badge variant="secondary">{boards.length}</Badge>
              </Link>
              <Link
                href={`/projects/${projectId}/members`}
                className="flex items-center justify-between rounded-lg border px-3 py-3 font-medium text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-2">
                  <IconUsersGroup className="h-4 w-4 text-primary" />
                  Members
                </span>
                <IconArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <CreateBoardDialog open={createBoardOpen} onOpenChange={setCreateBoardOpen} projectId={projectId} />
    </>
  );
}
