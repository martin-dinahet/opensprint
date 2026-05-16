export type {
  AddMemberInput,
  UpdateMemberInput,
} from "@/server/use-cases/member/dto";

export type MemberRole = "owner" | "admin" | "member";

export type MemberWithUserOutput = {
  id: string;
  userId: string;
  projectId: string;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};
