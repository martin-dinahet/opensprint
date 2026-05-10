"use client";

import { IconFolderPlus, IconPlus, IconStack } from "@tabler/icons-react";
import { useState } from "react";
import { ProjectCard, useProjects } from "@/entities/project";
import { CreateProjectDialog } from "@/features/create-project";
import { Button } from "@/shared/ui/button";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppShellHeader } from "@/widgets/app-sidebar";

export function DashboardPage() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <AppShellHeader
        title="Projects"
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="border-b bg-muted/20 px-6 py-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-medium text-muted-foreground text-xs uppercase">Workspace directory</p>
              <h2 className="mt-2 font-semibold text-2xl">Choose a project</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
                Projects collect the boards, members, and planning spaces for a body of work.
              </p>
            </div>
            <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)} variant="outline">
              <IconFolderPlus className="mr-2 h-4 w-4" />
              Create project
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-6">
          {isLoading ? (
            <LoadingScreen label="Loading projects..." variant="shell" />
          ) : !projects?.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <IconStack className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">No projects yet</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
