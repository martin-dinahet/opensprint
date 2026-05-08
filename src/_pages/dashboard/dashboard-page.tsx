"use client";

import { IconPlus, IconStack } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectCard, useProjects } from "@/entities/project";
import { CreateProjectDialog } from "@/features/create-project";
import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { AppHeader } from "@/widgets/app-header";

export function DashboardPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  if (!session.data?.user) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">Projects</h1>
              <p className="text-sm text-muted-foreground">Pick up active work or start a new board.</p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {isLoading ? (
            <LoadingScreen />
          ) : !projects?.length ? (
            <div className="mt-12 flex flex-col items-center justify-center">
              <IconStack className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">No projects yet</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => router.push(`/projects/${project.id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
