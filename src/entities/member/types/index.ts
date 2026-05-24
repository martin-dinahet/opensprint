export type {
  AddMemberInput,
  UpdateMemberInput,
} from "@/server/use-cases/member/dto";

import type { Member, User } from "@/shared";

export type MemberRole = Member["role"];

export type MemberWithUserOutput = {
  id: Member["id"];
  userId: Member["userId"];
  projectId: Member["organizationId"];
  role: MemberRole;
  createdAt: string;
  joinedAt: string;
  user: Pick<User, "email" | "id" | "image"> & {
    name: User["name"] | null;
  };
};
