"use client";

import { IconPlus, IconStack } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useCreateProject, useProjects } from "@/lib/queries";

export default function DashboardPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    const result = await createProject.mutateAsync({
      name: newProjectName,
      description: newProjectDesc || undefined,
    });
    setCreateOpen(false);
    setNewProjectName("");
    setNewProjectDesc("");
    router.push(`/projects/${result.id}`);
  };

  if (!session.data?.user) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <span className="font-semibold tracking-tight">OpenSprint</span>
        <Button variant="ghost" size="sm" onClick={() => authClient.signOut()}>
          Sign out
        </Button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">Projects</h1>
              <p className="text-sm text-muted-foreground">Manage your projects</p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                New Project
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new project</DialogTitle>
                  <DialogDescription>Add a new project to get started.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="My Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Project description..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={createProject.isPending || !newProjectName.trim()}>
                    {createProject.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <Card
                  key={project.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="font-semibold text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
