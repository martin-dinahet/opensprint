export type {
  AddMemberInput,
  UpdateMemberInput,
} from "@/server/use-cases/member/dto";

import type { Member, User } from "@/shared";

export type MemberRole = Member["role"];

export type MemberWithUserOutput = {
  id: Member["id"];
  userId: Member["userId"];
  projectId: Member["projectId"];
  role: MemberRole;
  joinedAt: string;
  user: Pick<User, "email" | "id" | "image"> & {
    name: User["name"] | null;
  };
};
