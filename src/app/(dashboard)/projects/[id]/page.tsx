"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useProject } from "@/entities/project";
import { LoadingScreen } from "@/shared";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectPage({ params }: Props) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);

  useEffect(() => {
    if (project?.defaultBoardId) {
      router.replace(`/projects/${projectId}/boards/${project.defaultBoardId}`);
    }
  }, [project?.defaultBoardId, projectId, router]);

  return <LoadingScreen label={isLoading ? "Loading project..." : "Opening board..."} variant="shell" />;
}
