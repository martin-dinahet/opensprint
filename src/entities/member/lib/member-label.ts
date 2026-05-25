import type { MemberWithUserOutput } from "../types";

export const getMemberLabel = (member: MemberWithUserOutput) => member.user.name || member.user.email;
