"use client";

import { err, ok } from "@punpun-dev/ts-result";
import { IconPlus, IconStack } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/features/project/components/create-project-dialog";
import { ProjectCard } from "@/features/project/components/project-card";
import { useCreateProject, useProjects } from "@/features/project/hooks";
import { AppHeader } from "@/features/shared/components/app-header";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;

    const result = await createProject
      .mutateAsync({
        name: newProjectName,
        description: newProjectDesc || undefined,
      })
      .then(ok)
      .catch((error: unknown) => err(error instanceof Error ? error : new Error("Unable to create project")));

    result.match({
      ok: (project) => {
        setCreateOpen(false);
        setCreateError(null);
        setNewProjectName("");
        setNewProjectDesc("");
        router.push(`/projects/${project.id}`);
      },
      err: (error) => setCreateError(error.message),
    });
  };

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
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
        onCreate={handleCreate}
        isPending={createProject.isPending}
        name={newProjectName}
        onNameChange={setNewProjectName}
        description={newProjectDesc}
        onDescriptionChange={setNewProjectDesc}
        error={createError}
      />
    </div>
  );
}
