"use client";

import { IconPlus, IconStack } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { ProjectCard, useProjects } from "@/entities/project";
import { CreateProjectDialog } from "@/features/create-project";
import { Button } from "@/shared/shadcn/button";
import { LoadingScreen } from "@/shared/shadcn/loading-screen";
import { useDashboardHeader } from "@/widgets/header";

export default function Page() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const header = useMemo(
    () => ({
      title: "Projects",
      actions: (
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      ),
    }),
    [],
  );

  useDashboardHeader(header);

  return (
    <>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-muted-foreground">Pick up active work or start a new project.</p>

          {isLoading ? (
            <LoadingScreen label="Loading projects..." variant="shell" />
          ) : !projects?.length ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <IconStack className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">No projects yet</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
