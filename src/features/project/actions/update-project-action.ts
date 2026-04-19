import { createAction } from "@/lib/create-action";
import { updateProject } from "../functions/update-project";
import { UpdateProjectSchema } from "../schemas/update-project-schema";

export const updateProjectAction = createAction({
  schema: UpdateProjectSchema,
  fn: (data) => updateProject(data.projectId, { name: data.name, description: data.description }),
});
