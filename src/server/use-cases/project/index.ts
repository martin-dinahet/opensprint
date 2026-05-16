export { CreateProjectUseCase } from "./create-project";
export { DeleteProjectUseCase } from "./delete-project";
export { GetProjectUseCase } from "./get-project";
export { ListProjectsUseCase } from "./list-projects";
export { UpdateProjectUseCase } from "./update-project";
import { CreateProjectUseCase } from "./create-project";
import { DeleteProjectUseCase } from "./delete-project";
import { GetProjectUseCase } from "./get-project";
import { ListProjectsUseCase } from "./list-projects";
import { UpdateProjectUseCase } from "./update-project";

export const createProject = CreateProjectUseCase.execute;
export const deleteProject = DeleteProjectUseCase.execute;
export const getProject = GetProjectUseCase.execute;
export const listProjects = ListProjectsUseCase.execute;
export const updateProject = UpdateProjectUseCase.execute;
