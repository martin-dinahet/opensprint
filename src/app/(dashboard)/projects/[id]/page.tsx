"use client";

import { use } from "react";
import { ProjectOverviewPage } from "@/pages/project-overview";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectPage({ params }: Props) {
  const { id: projectId } = use(params);

  return <ProjectOverviewPage projectId={projectId} />;
}
