"use client";

import { use } from "react";
import { ProjectMembersPage } from "@/_pages/project-members/page";

type Props = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: Props) {
  const { id: projectId } = use(params);

  return <ProjectMembersPage projectId={projectId} />;
}
