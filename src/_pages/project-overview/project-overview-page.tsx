"use client";

import { IconArrowRight, IconLayoutKanban, IconPlus, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useBoards } from "@/entities/board";
import { useProject } from "@/entities/project";
import { CreateBoardDialog } from "@/features/create-board";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
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

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {project?.description && <p className="max-w-2xl text-muted-foreground text-sm">{project.description}</p>}

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/projects/${projectId}/boards/${board.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="group rounded-lg transition-colors hover:bg-muted/50">
                    <CardHeader className="gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <IconLayoutKanban className="h-4 w-4 shrink-0 text-primary" />
                          <CardTitle className="truncate font-semibold text-lg">{board.name}</CardTitle>
                        </div>
                        <IconArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </div>
                      {board.description && (
                        <CardDescription className="line-clamp-2">{board.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-xs">Position {board.position + 1}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateBoardDialog open={createBoardOpen} onOpenChange={setCreateBoardOpen} projectId={projectId} />
    </>
  );
}
