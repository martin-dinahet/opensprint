export type {
  BoardOutput,
  CreateBoardInput,
  ReorderBoardsInput,
  UpdateBoardInput,
} from "@/server/features/board/dto";
export type {
  AddMemberInput,
  MemberOutput,
  MemberWithUserOutput,
  UpdateMemberInput,
} from "@/server/features/member/dto";
export type {
  CreateProjectInput,
  ProjectListOutput,
  ProjectOutput,
  UpdateProjectInput,
} from "@/server/features/project/dto";
export type {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  TaskOutput,
  UpdateTaskInput,
} from "@/server/features/task/dto";

export type { ServerVariables } from "@/server/lib/types";
