export type {
  AddMemberInput,
  UpdateMemberInput,
} from "@/server/use-cases/member/dto";

export type ProjectMemberRole = "owner" | "admin" | "member";

export type MemberWithUserOutput = {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};
