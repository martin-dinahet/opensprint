import { toast } from "sonner";
import { createAction } from "@/lib/create-action";
import { createProject } from "../functions/create-project";
import { CreateProjectSchema } from "../schemas/create-project-schema";

export const createProjectAction = createAction({
  schema: CreateProjectSchema,
  fn: (data) => createProject(data),
  onSuccess: () => {
    toast.success("Project created successfully.");
  },
});
